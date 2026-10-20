import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SCREENS } from '../src/screens.data';
import { FAMILIES, DEMO_LINKS, ScreenPage, FamilyPage, screenHref, parseRoute, screensForFamily } from '../src/screens';

describe('static screen directory', () => {
  it('connects every inventory entry through its family and breadcrumb, with valid internal targets', () => {
    expect(Object.keys(SCREENS)).toHaveLength(462);
    expect(FAMILIES).toHaveLength(19);
    const ids = FAMILIES.flatMap(f => screensForFamily(f.code));
    expect(new Set(ids).size).toBe(462);
    for (const family of FAMILIES) {
      const html = renderToStaticMarkup(<FamilyPage code={family.code} navigate={() => {}}/>);
      for (const id of screensForFamily(family.code)) expect(html).toContain(`href="${screenHref(id)}"`);
    }
    for (const id of ids) {
      expect(parseRoute(screenHref(id)).screen).toBe(id);
      const html = renderToStaticMarkup(<ScreenPage id={id} navigate={() => {}}/>);
      expect(html).toContain('aria-label="Breadcrumb"');
      expect(html).toContain('Backlog / full feature not implemented');
      for (const [, family, number] of html.matchAll(/href="#\/([A-Z]{2,4})\/(\d{2})"/g)) {
        expect(SCREENS[`${family}-${number}`], `${id} has a broken link`).toBeDefined();
      }
    }
    for (const id of Object.keys(DEMO_LINKS)) expect(SCREENS[id]).toBeDefined();
  });
});
