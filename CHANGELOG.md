# Changelog


## v0.1.0

[compare changes](https://github.com/dcupl/dcupl-nuxt/compare/v0.0.10...v0.1.0)

### 🚨 Breaking Changes

- Requires Nuxt 4 and the dcupl SDK 2.1 (`@dcupl/core`, `@dcupl/common`, `@dcupl/loader` ^2.1.0, TypeScript 5.4+ for the SDK types). The module is ESM only. See the SDK migration guide for 1.x → 2.x behaviour changes.
- Requires Node.js `^22.22.3 || ^24.15.0 || >=26.0.0`, like Nuxt 4.6 (`engines` in package.json); 0.0.x documented Node 20.
- `useNuxtApp().$dcuplServer` is removed. `$dcuplSession` is the browser instance holder and `undefined` on the server.
- `$dcuplSession` lost `shouldUpdate()` and `changedAt`, and `init()` takes no second argument (the custom update function) any more; update checks run on the server only.
- On the server, `useDcupl()` and `useDcuplServerInstance(event)` return a per-request wrapper of the shared instance; `lists.destroy()` without options destroys only the lists of the current request.
- Lists created through `useDcuplServerInstance(event)` in API routes are destroyed after the response, also when the route throws or the client aborts. Keep nothing from them beyond the request.
- `useDcuplServerInstance(event)` rejects once the response has finished (for example in `event.waitUntil()` work started by the route); take the instance before the response.
- A failed first build of the server instance answers 500 to every SSR request (each request tries the build again); 0.0.x rendered the page with `$dcupl` undefined.
- Update checks no longer block SSR: a request right after a change can still get the previous data until the new instance is built. Without a `projectId` there are no automatic checks (0.0.x rebuilt the instance on every request).
- Internal state moved: `nitroApp._dcuplNitroInstance`, `event.context._dcupl` and the `#build/should-update` template are gone.

### 🩹 Fixes

- Destroy only the lists a request created after SSR, not the lists of concurrent requests.
- Check for updates at most once per `updateCheckInterval` (default 60 s) instead of on every SSR request, and share a running check.
- Build a new instance completely before swapping it in, and destroy the old one only after the last request using it has finished, also after error responses and aborted requests.
- Retry a failed background rebuild at the next update check instead of serving the old data until the next change.
- `useNuxtApp().$dcupl` and `useDcupl()` are typed `Dcupl` in the published types.
- One instance per server process for SSR and Nitro API routes, so the reload hook refreshes both. The hook answers 500 when the build fails.
- Keep the `shouldUpdate` function out of the public runtime config.

### 🚀 Enhancements

- New option `updateCheckInterval` (ms, `false` disables automatic checks; runtime config `dcupl.updateCheckInterval`).

### 🏡 Chore

- SDK 2.1.0, @nuxt/kit 4, module-builder 1.0, Vitest 4; playground on Tailwind 4; README for Nuxt 4 and SDK 2.x.


## v0.0.10

[compare changes](https://github.com/dcupl/dcupl-nuxt/compare/v0.0.9...v0.0.10)

### 🩹 Fixes

- Destroy lists when SSR rendering finished ([596c2aa](https://github.com/dcupl/dcupl-nuxt/commit/596c2aa))

### ❤️ Contributors

- Dominik Strasser ([@dominikstrasser](http://github.com/dominikstrasser))

## v0.0.9

[compare changes](https://github.com/dcupl/dcupl-nuxt/compare/v0.0.8...v0.0.9)

### 🏡 Chore

- Update readme ([7a789cd](https://github.com/dcupl/dcupl-nuxt/commit/7a789cd))

### ❤️ Contributors

- Dominik Strasser ([@dominikstrasser](http://github.com/dominikstrasser))

## v0.0.8

[compare changes](https://github.com/dcupl/dcupl-nuxt/compare/v0.0.7...v0.0.8)

### 🏡 Chore

- Update #dcupl/server import ([4611f20](https://github.com/dcupl/dcupl-nuxt/commit/4611f20))
- Remove paths from tsconfig ([7805cb2](https://github.com/dcupl/dcupl-nuxt/commit/7805cb2))

### ❤️ Contributors

- Dominik Strasser ([@dominikstrasser](http://github.com/dominikstrasser))

## v0.0.7

[compare changes](https://github.com/dcupl/dcupl-nuxt/compare/v0.0.6...v0.0.7)

### 🩹 Fixes

- Prepend runtime folder ([0b2e46a](https://github.com/dcupl/dcupl-nuxt/commit/0b2e46a))

### 🏡 Chore

- Update readme and package.json ([6dea142](https://github.com/dcupl/dcupl-nuxt/commit/6dea142))

### ❤️ Contributors

- Dominik Strasser ([@dominikstrasser](http://github.com/dominikstrasser))

## v0.0.6

[compare changes](https://github.com/dcupl/dcupl-nuxt/compare/v0.0.5...v0.0.6)

### 🏡 Chore

- Remove unused transpile step ([7f4a8f3](https://github.com/dcupl/dcupl-nuxt/commit/7f4a8f3))
- Update packages ([d2b3682](https://github.com/dcupl/dcupl-nuxt/commit/d2b3682))
- Remove unused cast ([13dcf51](https://github.com/dcupl/dcupl-nuxt/commit/13dcf51))

### ❤️ Contributors

- Dominik Strasser ([@dominikstrasser](http://github.com/dominikstrasser))

## v0.0.5

[compare changes](https://github.com/dcupl/dcupl-nuxt/compare/v0.0.4...v0.0.5)

### 🏡 Chore

- Update readme ([8a77a71](https://github.com/dcupl/dcupl-nuxt/commit/8a77a71))
- Try to transpile ([d7a5023](https://github.com/dcupl/dcupl-nuxt/commit/d7a5023))

### ❤️ Contributors

- Dominik Strasser ([@dominikstrasser](http://github.com/dominikstrasser))

## v0.0.4

[compare changes](https://github.com/dcupl/dcupl-nuxt/compare/v0.0.3...v0.0.4)

### 🏡 Chore

- Move files into runtime folder ([df6e2e4](https://github.com/dcupl/dcupl-nuxt/commit/df6e2e4))

### ❤️ Contributors

- Dominik Strasser ([@dominikstrasser](http://github.com/dominikstrasser))

## v0.0.3

[compare changes](https://github.com/dcupl/dcupl-nuxt/compare/v0.0.2...v0.0.3)

### 🏡 Chore

- Update publish command ([06e3d51](https://github.com/dcupl/dcupl-nuxt/commit/06e3d51))
- Update readme and module ([c3c58e2](https://github.com/dcupl/dcupl-nuxt/commit/c3c58e2))

### ❤️ Contributors

- Dominik Strasser ([@dominikstrasser](http://github.com/dominikstrasser))

## v0.0.2


### 🚀 Enhancements

- Added server context ([3b5f25f](https://github.com/dcupl/dcupl-nuxt/commit/3b5f25f))
- Adds imports and query token authorization ([fa6d99b](https://github.com/dcupl/dcupl-nuxt/commit/fa6d99b))

### 🔥 Performance

- Use the dcupl api instead of creating lists ([edf0d18](https://github.com/dcupl/dcupl-nuxt/commit/edf0d18))

### 🩹 Fixes

- CustomShouldUpdate should return a Promise ([b059b47](https://github.com/dcupl/dcupl-nuxt/commit/b059b47))

### 🏡 Chore

- Rename customUpdateFunction ([f92db64](https://github.com/dcupl/dcupl-nuxt/commit/f92db64))
- Remove unused await ([3b1bc27](https://github.com/dcupl/dcupl-nuxt/commit/3b1bc27))
- Clean up customShouldUpdate ([e37ab89](https://github.com/dcupl/dcupl-nuxt/commit/e37ab89))
- Options may be undefined ([d6e6a49](https://github.com/dcupl/dcupl-nuxt/commit/d6e6a49))
- Add propper imports ([b80319c](https://github.com/dcupl/dcupl-nuxt/commit/b80319c))
- Add import and types to NitroApp, rename ([29ba43c](https://github.com/dcupl/dcupl-nuxt/commit/29ba43c))
- Rename fn; use correct type ([40b9ec3](https://github.com/dcupl/dcupl-nuxt/commit/40b9ec3))
- Adds moduleResolution node to remove errors in vscode ([bb75766](https://github.com/dcupl/dcupl-nuxt/commit/bb75766))
- Adds dcupl sdk to playground ([48ccc09](https://github.com/dcupl/dcupl-nuxt/commit/48ccc09))
- Update package.json ([2eaea4f](https://github.com/dcupl/dcupl-nuxt/commit/2eaea4f))
- Cleanup ([c397017](https://github.com/dcupl/dcupl-nuxt/commit/c397017))
- Set initial version ([63c4745](https://github.com/dcupl/dcupl-nuxt/commit/63c4745))

### ❤️ Contributors

- Dominik Strasser ([@dominikstrasser](http://github.com/dominikstrasser))
- Markus Geilehner ([@markus-gx](http://github.com/markus-gx))

