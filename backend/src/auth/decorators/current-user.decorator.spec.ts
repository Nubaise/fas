import { describe, expect, it } from '@jest/globals';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';

import { CurrentUser } from './current-user.decorator.js';

describe('CurrentUser', () => {
  it('creates parameter decorator metadata', () => {
    class TestController {
      test(@CurrentUser() _user: unknown) {}
    }

    const metadata = Reflect.getMetadata(
      ROUTE_ARGS_METADATA,
      TestController,
      'test',
    );

    expect(metadata).toBeDefined();
    expect(Object.keys(metadata)).toHaveLength(1);
  });
});
