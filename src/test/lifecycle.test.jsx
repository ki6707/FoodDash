import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import App from '../App';
import { AppProvider, useApp } from '../context/AppContext';
import { canTransition, deliveryCode, priceQuote } from '../utils/orderStatus';
import { getDishImage } from '../data/foodImages';

let ctx;
let go;
function Probe() { ctx = useApp(); go = useNavigate(); return null; }

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppProvider><Probe /><App /></AppProvider>
    </MemoryRouter>,
  );
}

describe('order rules', () => {
  it('only allows permitted actors to move an order', () => {
    expect(canTransition('placed', 'confirmed', 'admin')).toBe(true);
    expect(canTransition('placed', 'confirmed', 'customer')).toBe(false);
    expect(canTransition('placed', 'delivered', 'delivery')).toBe(false);
    expect(canTransition('preparing', 'cancelled', 'customer')).toBe(false);
    expect(canTransition('out_for_delivery', 'delivered', 'delivery')).toBe(true);
  });
  it('computes totals and coupons server-style', () => {
    const lines = [{ price: 200, qty: 2 }];
    const q = priceQuote(lines, { fee: 30 }, { active: true, type: 'percent', value: 50, max: 100, minOrder: 199 });
    expect(q).toMatchObject({ subtotal: 400, tax: 20, discount: 100, total: 350 });
    expect(priceQuote(lines, { fee: 30 }, { active: true, type: 'flat', value: 75, max: 75, minOrder: 999 }).discount).toBe(0);
  });
});

describe('menu photography', () => {
  it('uses restaurant-specific photos for kitchens in the same cuisine', () => {
    renderAt('/restaurants?category=south');
    const dosaImage = screen.getByRole('link', { name: /dosa junction/i }).querySelector('img');
    const mealsImage = screen.getByRole('link', { name: /green leaf meals/i }).querySelector('img');
    expect(dosaImage.src).not.toBe(mealsImage.src);
    expect(dosaImage.alt).toMatch(/dosa/i);
    expect(mealsImage.alt).toMatch(/thali/i);
  });

  it('fills new restaurant photo keys into older saved demo records', () => {
    window.localStorage.setItem('fooddash-prototype-v1', JSON.stringify({
      restaurants: [{
        id: 'r7', name: 'Green Leaf Meals', category: 'south', cuisine: ['South Indian', 'Meals'],
        rating: 4.4, eta: 30, priceFor2: 280, veg: true, color: '#166534', approval: 'approved', open: true,
      }],
    }));
    renderAt('/restaurants?category=south');
    const mealsImage = screen.getByRole('link', { name: /green leaf meals/i }).querySelector('img');
    expect(mealsImage.alt).toMatch(/thali/i);
  });

  it('matches specialty items before their restaurant category', () => {
    expect(getDishImage('Tiramisu', 'pizza').alt).toMatch(/tiramisu/i);
    expect(getDishImage('Chocolate Shake', 'burger').alt).toMatch(/milkshake/i);
    expect(getDishImage('Filter Coffee', 'south').alt).toMatch(/filter coffee/i);
    expect(getDishImage('Gulab Jamun (2 pc)', 'biryani').alt).toMatch(/indian sweets/i);
    expect(getDishImage('Payasam', 'dessert').alt).toMatch(/indian sweets/i);
    expect(getDishImage('Chicken Fried Rice', 'chinese').alt).toMatch(/fried rice/i);
    expect(getDishImage('Chilli Chicken', 'chinese').alt).toMatch(/chicken/i);
    expect(getDishImage('Medu Vada (2 pc)', 'south').alt).toMatch(/fried snack/i);
    expect(getDishImage('Gobi Manchurian', 'chinese').alt).toMatch(/cauliflower/i);
  });

  it('uses distinct photos for meals, tiffin, and curd rice', () => {
    const images = ['Full Meals', 'Mini Tiffin', 'Curd Rice'].map((name) => getDishImage(name, 'south'));
    expect(new Set(images.map((image) => image.src)).size).toBe(3);
    expect(images[0].alt).toMatch(/south indian thali/i);
    expect(images[1].alt).toMatch(/tiffin|idli/i);
    expect(images[2].alt).toMatch(/bowl of rice/i);
  });
});

describe('route protection', () => {
  it('sends anonymous users away from admin and delivery portals', () => {
    renderAt('/admin/dashboard');
    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
  });
  it('blocks a customer from the admin and delivery portals', async () => {
    renderAt('/login?role=customer');
    await userEvent.click(screen.getByRole('button', { name: /skip with demo customer/i }));
    await act(async () => go('/admin/dashboard'));
    expect(screen.getByRole('alert')).toHaveTextContent(/different role/i);
    await act(async () => go('/delivery/dashboard'));
    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
  });
});

describe('end to end: customer -> admin -> delivery', () => {
  it('keeps one consistent status across all portals', async () => {
    const user = userEvent.setup();
    renderAt('/login?role=customer');
    await user.click(screen.getByRole('button', { name: /skip with demo customer/i }));

    await user.click(screen.getAllByRole('link', { name: /restaurants/i })[0]);
    await user.click(screen.getByRole('link', { name: /dosa junction/i }));
    await user.click(screen.getAllByRole('button', { name: /^add$/i })[0]);
    await user.click(screen.getByRole('link', { name: /review cart/i }));
    await user.click(screen.getByRole('button', { name: /proceed to checkout/i }));
    await user.click(screen.getByLabelText(/cash on delivery/i));
    await user.click(screen.getByRole('button', { name: /place order/i }));

    // lands on the order page, not back on the cart
    expect(await screen.findByRole('heading', { name: /^FD-\d+$/ })).toBeInTheDocument();
    const order = ctx.orders[0];
    expect(order.status).toBe('placed');
    expect(order.subtotal).toBe(90);
    expect(order.total).toBe(90 + 20 + 4.5);
    expect(ctx.cartCount).toBe(0);

    // wrong actors refused
    expect(ctx.transitionOrder(order.id, 'confirmed', 'customer')).toBe(false);
    expect(ctx.transitionOrder(order.id, 'delivered', 'delivery')).toBe(false);

    // admin kitchen flow, one render per click like the real UI
    for (const step of ['confirmed', 'preparing', 'ready_for_pickup']) {
      await act(async () => { ctx.transitionOrder(order.id, step, 'admin'); });
      expect(ctx.orders[0].status).toBe(step);
    }
    // customer sees the same status on their own order page
    expect(screen.getByText('Ready for pickup', { selector: '.badge' })).toBeInTheDocument();
    // customer can no longer cancel once preparation has started
    expect(ctx.transitionOrder(order.id, 'cancelled', 'customer')).toBe(false);
    // admin assigns a rider, then the rider finishes the job
    await act(async () => { ctx.assignPartner(order.id, 'd3'); });
    expect(ctx.orders[0]).toMatchObject({ status: 'delivery_assigned', deliveryPartnerId: 'd3' });
    for (const step of ['picked_up', 'out_for_delivery', 'delivered']) {
      await act(async () => { ctx.transitionOrder(order.id, step, 'delivery'); });
    }
    expect(ctx.orders[0]).toMatchObject({ status: 'delivered', paymentStatus: 'paid' });
    expect(ctx.orders[0].history.map((h) => h.to)).toEqual([
      'placed', 'confirmed', 'preparing', 'ready_for_pickup', 'delivery_assigned', 'picked_up', 'out_for_delivery', 'delivered',
    ]);
  });

  it('runs the full delivery chain with atomic claiming and code check', async () => {
    renderAt('/login?role=delivery');
    await userEvent.click(screen.getByRole('button', { name: /skip with demo delivery/i }));
    expect(await screen.findByRole('heading', { name: /you're online/i })).toBeInTheDocument();

    // seed order o4 is ready_for_pickup and unclaimed
    const o4 = ctx.orders.find((o) => o.id === 'o4');
    expect(o4.status).toBe('ready_for_pickup');

    // rider d1 already has an active job (o1); finish it with a bad then a good code
    await act(async () => go('/delivery/active'));
    expect(screen.getByRole('heading', { name: 'FD-10231' })).toBeInTheDocument();
    const input = screen.getByLabelText(/delivery code/i);
    await userEvent.type(input, '0000');
    await userEvent.click(screen.getByRole('button', { name: /confirm delivery/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/does not match/i);
    expect(ctx.orders.find((o) => o.id === 'o1').status).toBe('out_for_delivery');

    await userEvent.clear(input);
    await userEvent.type(input, deliveryCode(ctx.orders.find((o) => o.id === 'o1')));
    await userEvent.click(screen.getByRole('button', { name: /confirm delivery/i }));
    expect(ctx.orders.find((o) => o.id === 'o1').status).toBe('delivered');
    expect(ctx.orders.find((o) => o.id === 'o1').paymentStatus).toBe('paid');

    // now accept the open offer; a second claim must fail
    await act(async () => go('/delivery/requests'));
    await userEvent.click(await screen.findByRole('button', { name: /accept/i }));
    expect(ctx.orders.find((o) => o.id === 'o4')).toMatchObject({ status: 'delivery_assigned', deliveryPartnerId: 'd1' });
    expect(ctx.transitionOrder('o4', 'delivery_assigned', 'delivery', { deliveryPartnerId: 'd3' })).toBe(false);
    expect(ctx.orders.find((o) => o.id === 'o4').deliveryPartnerId).toBe('d1');
  });
});
