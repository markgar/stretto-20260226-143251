import { adminNavItems, memberNavItems } from './nav';

test('adminNavItems has 8 entries', () => {
  expect(adminNavItems).toHaveLength(8);
});

test('adminNavItems starts with Dashboard pointing to /dashboard', () => {
  expect(adminNavItems[0].label).toBe('Dashboard');
  expect(adminNavItems[0].to).toBe('/dashboard');
});

test('adminNavItems includes all expected routes', () => {
  const routes = adminNavItems.map((item) => item.to);
  expect(routes).toContain('/dashboard');
  expect(routes).toContain('/program-years');
  expect(routes).toContain('/projects');
  expect(routes).toContain('/utilization');
  expect(routes).toContain('/members');
  expect(routes).toContain('/auditions');
  expect(routes).toContain('/venues');
  expect(routes).toContain('/notifications');
});

test('memberNavItems has 4 entries', () => {
  expect(memberNavItems).toHaveLength(4);
});

test('memberNavItems includes expected member routes', () => {
  const routes = memberNavItems.map((item) => item.to);
  expect(routes).toContain('/my-projects');
  expect(routes).toContain('/my-calendar');
  expect(routes).toContain('/auditions');
  expect(routes).toContain('/profile');
});

test('every nav item has label, to, and icon', () => {
  [...adminNavItems, ...memberNavItems].forEach((item) => {
    expect(item.label).toBeTruthy();
    expect(item.to).toBeTruthy();
    expect(item.icon).toBeTruthy();
  });
});

test('all nav item paths start with /', () => {
  [...adminNavItems, ...memberNavItems].forEach((item) => {
    expect(item.to.startsWith('/')).toBe(true);
  });
});
