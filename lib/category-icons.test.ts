import { test } from 'node:test';
import assert from 'node:assert';
import { ICONS } from '@/components/transactions/category-icon';
import { CATEGORY_ICONS } from '@/components/settings/icon-picker';
import { GOAL_ICONS } from '@/components/goals/goal-dialogs';
import { DEFAULT_CATEGORIES } from './categories';

test('every icon the app offers or seeds can be rendered', () => {
  const offered = [...CATEGORY_ICONS.map((i) => i.name), ...GOAL_ICONS, ...DEFAULT_CATEGORIES.map((c) => c.icon)];
  assert.deepEqual(offered.filter((name) => !ICONS[name]), []);
});
