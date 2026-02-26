import { cn } from './utils';

test('returns a single class unchanged', () => {
  expect(cn('text-red-500')).toBe('text-red-500');
});

test('merges multiple classes into a space-separated string', () => {
  expect(cn('px-4', 'py-2', 'text-sm')).toBe('px-4 py-2 text-sm');
});

test('deduplicates conflicting Tailwind classes, keeping the last one', () => {
  expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
});

test('ignores falsy values like undefined, null, and false', () => {
  expect(cn('base', undefined, null, false, 'extra')).toBe('base extra');
});

test('handles conditional class objects', () => {
  expect(cn({ 'font-bold': true, italic: false })).toBe('font-bold');
});

test('merges conflicting padding utilities correctly', () => {
  expect(cn('p-4', 'px-2')).toBe('p-4 px-2');
});

test('returns empty string when given no arguments', () => {
  expect(cn()).toBe('');
});
