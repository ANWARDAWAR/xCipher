var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// _worker.js/index.js
import("node:buffer").then(({ Buffer: Buffer2 }) => {
  globalThis.Buffer = Buffer2;
}).catch(() => null);
var __ALSes_PROMISE__ = import("node:async_hooks").then(({ AsyncLocalStorage }) => {
  globalThis.AsyncLocalStorage = AsyncLocalStorage;
  const envAsyncLocalStorage = new AsyncLocalStorage();
  const requestContextAsyncLocalStorage = new AsyncLocalStorage();
  globalThis.process = {
    env: new Proxy(
      {},
      {
        ownKeys: /* @__PURE__ */ __name(() => Reflect.ownKeys(envAsyncLocalStorage.getStore()), "ownKeys"),
        getOwnPropertyDescriptor: /* @__PURE__ */ __name((_2, ...args) => Reflect.getOwnPropertyDescriptor(envAsyncLocalStorage.getStore(), ...args), "getOwnPropertyDescriptor"),
        get: /* @__PURE__ */ __name((_2, property) => Reflect.get(envAsyncLocalStorage.getStore(), property), "get"),
        set: /* @__PURE__ */ __name((_2, property, value) => Reflect.set(envAsyncLocalStorage.getStore(), property, value), "set")
      }
    )
  };
  globalThis[/* @__PURE__ */ Symbol.for("__cloudflare-request-context__")] = new Proxy(
    {},
    {
      ownKeys: /* @__PURE__ */ __name(() => Reflect.ownKeys(requestContextAsyncLocalStorage.getStore()), "ownKeys"),
      getOwnPropertyDescriptor: /* @__PURE__ */ __name((_2, ...args) => Reflect.getOwnPropertyDescriptor(requestContextAsyncLocalStorage.getStore(), ...args), "getOwnPropertyDescriptor"),
      get: /* @__PURE__ */ __name((_2, property) => Reflect.get(requestContextAsyncLocalStorage.getStore(), property), "get"),
      set: /* @__PURE__ */ __name((_2, property, value) => Reflect.set(requestContextAsyncLocalStorage.getStore(), property, value), "set")
    }
  );
  return { envAsyncLocalStorage, requestContextAsyncLocalStorage };
}).catch(() => null);
var nt = Object.create;
var z = Object.defineProperty;
var it = Object.getOwnPropertyDescriptor;
var at = Object.getOwnPropertyNames;
var ct = Object.getPrototypeOf;
var rt = Object.prototype.hasOwnProperty;
var T = /* @__PURE__ */ __name((t, e) => () => (t && (e = t(t = 0)), e), "T");
var H = /* @__PURE__ */ __name((t, e) => () => (e || t((e = { exports: {} }).exports, e), e.exports), "H");
var ot = /* @__PURE__ */ __name((t, e, n, s) => {
  if (e && typeof e == "object" || typeof e == "function") for (let a of at(e)) !rt.call(t, a) && a !== n && z(t, a, { get: /* @__PURE__ */ __name(() => e[a], "get"), enumerable: !(s = it(e, a)) || s.enumerable });
  return t;
}, "ot");
var U = /* @__PURE__ */ __name((t, e, n) => (n = t != null ? nt(ct(t)) : {}, ot(e || !t || !t.__esModule ? z(n, "default", { value: t, enumerable: true }) : n, t)), "U");
var y;
var u = T(() => {
  y = { collectedLocales: [] };
});
var _;
var p = T(() => {
  _ = { version: 3, routes: { none: [{ src: "^(?:/((?:[^/]+?)(?:/(?:[^/]+?))*))/$", headers: { Location: "/$1" }, status: 308, continue: true }, { src: "^/_next/__private/trace$", dest: "/404", status: 404, continue: true }, { src: "^/(?!_next/data(?:/|$))(.*)$", has: [{ type: "header", key: "x-nextjs-data" }], transforms: [{ type: "request.headers", op: "delete", target: { key: "x-nextjs-data" } }], continue: true }, { src: "^/_next/data/(.*)$", missing: [{ type: "header", key: "x-nextjs-data" }], transforms: [{ type: "request.headers", op: "append", target: { key: "x-nextjs-data" }, args: "1" }], continue: true }, { src: "^(?:/(.*))(?:/)?$", headers: { "Content-Security-Policy": "default-src 'self'; script-src 'self'  'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https:; font-src 'self' data:; frame-src 'self' https://www.youtube-nocookie.com; frame-ancestors 'none'; connect-src 'self' https:;", "X-Frame-Options": "DENY", "X-Content-Type-Options": "nosniff", "X-XSS-Protection": "1; mode=block", "Referrer-Policy": "strict-origin-when-cross-origin", "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload" }, continue: true }, { src: "^/404/?$", status: 404, continue: true, missing: [{ type: "header", key: "x-prerender-revalidate" }] }, { src: "^/500$", status: 500, continue: true }, { src: "^/_next/data/9uNlunAtO2_V2KLLYQstZ/(.*).json$", dest: "/$1", override: true, continue: true, has: [{ type: "header", key: "x-nextjs-data" }] }, { src: "^/index(?:/)?$", has: [{ type: "header", key: "x-nextjs-data" }], dest: "/", override: true, continue: true }, { src: "^/(.*)$", has: [{ type: "header", key: "next-action", value: "409935cb9638092d3c49ae5110333d66f31694e143" }], transforms: [{ type: "request.headers", op: "set", target: { key: "x-server-action-name" }, args: "app/actions/search.ts#getLiveSearchResults" }] }, { src: "^/(.*)$", has: [{ type: "header", key: "next-action", value: "60b81da1e50b3be83103de45fc48c147b58e1fa57d" }], transforms: [{ type: "request.headers", op: "set", target: { key: "x-server-action-name" }, args: "app/actions/newsletter.ts#subscribeNewsletter" }] }, { src: "^/(.*)$", has: [{ type: "header", key: "next-action", value: "40a3c1772852763608f918156f3f768656d941e4ac" }], transforms: [{ type: "request.headers", op: "set", target: { key: "x-server-action-name" }, args: "app/actions/comments.ts#getComments" }] }, { src: "^/(.*)$", has: [{ type: "header", key: "next-action", value: "0083d3352eb598220f8e7592ec2aa9490c9adfff52" }], transforms: [{ type: "request.headers", op: "set", target: { key: "x-server-action-name" }, args: "app/actions/notifications.ts#markAllNotificationsRead" }] }, { src: "^/(.*)$", has: [{ type: "header", key: "next-action", value: "4012d489ee69e0c819539176048886bec55b5191d1" }], transforms: [{ type: "request.headers", op: "set", target: { key: "x-server-action-name" }, args: "app/actions/notifications.ts#markNotificationRead" }] }, { src: "^/(.*)$", has: [{ type: "header", key: "next-action", value: "00a09384e2b0e9d7de572a221c567d55b6aaa989b9" }], transforms: [{ type: "request.headers", op: "set", target: { key: "x-server-action-name" }, args: "app/actions/notifications.ts#getNotifications" }] }, { src: "^/(.*)$", has: [{ type: "header", key: "next-action", value: "7811c9dfea81d104ea9a923bda75ec758e7f27be00" }], transforms: [{ type: "request.headers", op: "set", target: { key: "x-server-action-name" }, args: "app/actions/notifications.ts#createNotification" }] }, { src: "^/(.*)$", has: [{ type: "header", key: "next-action", value: "60550fac6b02a9441adc1902ee389a789b4ed4a17e" }], transforms: [{ type: "request.headers", op: "set", target: { key: "x-server-action-name" }, args: "app/admin/actions/dashboard-actions.ts#getTopStories" }] }, { src: "^/(.*)$", has: [{ type: "header", key: "next-action", value: "40fb9b83c8ac5a55b376f8971afbe31731c8193989" }], transforms: [{ type: "request.headers", op: "set", target: { key: "x-server-action-name" }, args: "app/actions/workflow.ts#bulkArchive" }] }, { src: "^/(.*)$", has: [{ type: "header", key: "next-action", value: "402022e65e6d97e0aa0d99cca6dfa9632df0dab8bf" }], transforms: [{ type: "request.headers", op: "set", target: { key: "x-server-action-name" }, args: "app/actions/workflow.ts#bulkRestore" }] }, { src: "^/(.*)$", has: [{ type: "header", key: "next-action", value: "402cee7bf7694dfc0be33fd9e43eaa6fe649b8aa2d" }], transforms: [{ type: "request.headers", op: "set", target: { key: "x-server-action-name" }, args: "app/actions/workflow.ts#bulkPublish" }] }, { src: "^/(.*)$", has: [{ type: "header", key: "next-action", value: "4061df6eb8318ee2e4c11f3219786cb80f2ca642ed" }], transforms: [{ type: "request.headers", op: "set", target: { key: "x-server-action-name" }, args: "app/actions/workflow.ts#bulkSubmit" }] }, { src: "^/(.*)$", has: [{ type: "header", key: "next-action", value: "406bcc5756498661c8e15a7fb347d232fa65969075" }], transforms: [{ type: "request.headers", op: "set", target: { key: "x-server-action-name" }, args: "app/actions/workflow.ts#bulkDelete" }] }, { src: "^/(.*)$", has: [{ type: "header", key: "next-action", value: "7034dc9cb31df5ea5cd43d660d801a60a86010ccaa" }], transforms: [{ type: "request.headers", op: "set", target: { key: "x-server-action-name" }, args: "app/actions/comments.ts#moderateComment" }] }, { src: "^/(.*)$", has: [{ type: "header", key: "next-action", value: "00463b97d09cad48a084c17d22bb0b87fe7fe9c1a1" }], transforms: [{ type: "request.headers", op: "set", target: { key: "x-server-action-name" }, args: "app/actions/taxonomy.ts#getTags" }] }, { src: "^/(.*)$", has: [{ type: "header", key: "next-action", value: "0092d1c9e94ea08f5947d64e8c52308bc399f33ad4" }], transforms: [{ type: "request.headers", op: "set", target: { key: "x-server-action-name" }, args: "app/actions/taxonomy.ts#getCategories" }] }, { src: "^/(.*)$", has: [{ type: "header", key: "next-action", value: "405ce4d59f3f3cf892e7ef7000c3868351dda74e01" }], transforms: [{ type: "request.headers", op: "set", target: { key: "x-server-action-name" }, args: "app/actions/taxonomy.ts#deleteCategory" }] }, { src: "^/(.*)$", has: [{ type: "header", key: "next-action", value: "40c2bddc36aa276f59b12fba654ffb08efe29b4383" }], transforms: [{ type: "request.headers", op: "set", target: { key: "x-server-action-name" }, args: "app/actions/taxonomy.ts#deleteTag" }] }, { src: "^/(.*)$", has: [{ type: "header", key: "next-action", value: "40ca5e4442eecd4552e0fc5233bdd86f9ee6d0fced" }], transforms: [{ type: "request.headers", op: "set", target: { key: "x-server-action-name" }, args: "app/actions/taxonomy.ts#createTag" }] }, { src: "^/(.*)$", has: [{ type: "header", key: "next-action", value: "40cd63039b335db90e39d67498b8c946f2ec7bc9ca" }], transforms: [{ type: "request.headers", op: "set", target: { key: "x-server-action-name" }, args: "app/actions/taxonomy.ts#getSubcategories" }] }, { src: "^/(.*)$", has: [{ type: "header", key: "next-action", value: "40f8a1320199e4cd971a5b292ee1274068dbfcff1e" }], transforms: [{ type: "request.headers", op: "set", target: { key: "x-server-action-name" }, args: "app/actions/taxonomy.ts#createCategory" }] }, { src: "^/(.*)$", has: [{ type: "header", key: "next-action", value: "60398b3e24db33acbc2765dd550cf79437fa56cb0a" }], transforms: [{ type: "request.headers", op: "set", target: { key: "x-server-action-name" }, args: "app/actions/taxonomy.ts#mergeTags" }] }, { src: "^/(.*)$", has: [{ type: "header", key: "next-action", value: "6064b3ab2350a1c03a1087e2efb92c635dfe212799" }], transforms: [{ type: "request.headers", op: "set", target: { key: "x-server-action-name" }, args: "app/actions/taxonomy.ts#mergeCategories" }] }, { src: "^/(.*)$", has: [{ type: "header", key: "next-action", value: "607f0071be393db2c0fab9c134f3514fbab0733550" }], transforms: [{ type: "request.headers", op: "set", target: { key: "x-server-action-name" }, args: "app/actions/taxonomy.ts#updateCategory" }] }, { src: "^/(.*)$", has: [{ type: "header", key: "next-action", value: "60b2c874501f997c4bb41fa22ddd4255cccc6504d7" }], transforms: [{ type: "request.headers", op: "set", target: { key: "x-server-action-name" }, args: "app/actions/taxonomy.ts#updateTag" }] }, { src: "^/(.*)$", has: [{ type: "header", key: "next-action", value: "60c9223894fd3b27ba9d433a6a3a840f3f17e241fa" }], transforms: [{ type: "request.headers", op: "set", target: { key: "x-server-action-name" }, args: "app/actions/taxonomy.ts#createSubcategory" }] }, { src: "^/(.*)$", has: [{ type: "header", key: "next-action", value: "70ac5d4ae681acd417c7e39823ea1af0a4ba09eebb" }], transforms: [{ type: "request.headers", op: "set", target: { key: "x-server-action-name" }, args: "app/admin/(authenticated)/review/[id]/page.tsx#anonymous_fn" }] }, { src: "^/(.*)$", has: [{ type: "header", key: "next-action", value: "40e797ea9de4826ff72032db058839bab8b1932109" }], transforms: [{ type: "request.headers", op: "set", target: { key: "x-server-action-name" }, args: "app/actions/profile.ts#updateProfile" }] }, { src: "^/(.*)$", has: [{ type: "header", key: "next-action", value: "400b23a543a00ee795fa46e70f218cfe484e2990e6" }], transforms: [{ type: "request.headers", op: "set", target: { key: "x-server-action-name" }, args: "app/actions/profile.ts#updateNotificationPrefs" }] }, { src: "^/(.*)$", has: [{ type: "header", key: "next-action", value: "40cfc3880a30a2e519228fd12d03bc076421b4a3b8" }], transforms: [{ type: "request.headers", op: "set", target: { key: "x-server-action-name" }, args: "app/actions/settings.ts#updatePublicationSettings" }] }, { src: "^/(.*)$", has: [{ type: "header", key: "next-action", value: "60a92a570c64c10c5531e7eb5e9df7f5becadc07ea" }], transforms: [{ type: "request.headers", op: "set", target: { key: "x-server-action-name" }, args: "app/actions/newsletter.ts#sendNewsletterBroadcast" }] }, { src: "^/(.*)$", has: [{ type: "header", key: "next-action", value: "40f9a2ad20dd350643f82c9527f40fed354a13a726" }], transforms: [{ type: "request.headers", op: "set", target: { key: "x-server-action-name" }, args: "app/actions/newsletter.ts#adminUnsubscribeUser" }] }, { src: "^/(.*)$", has: [{ type: "header", key: "next-action", value: "40f71f45faf8191a859605ccf2092f931c15085d1f" }], transforms: [{ type: "request.headers", op: "set", target: { key: "x-server-action-name" }, args: "app/actions/newsletter.ts#adminDeleteSubscriber" }] }, { src: "^/(.*)$", has: [{ type: "header", key: "next-action", value: "60913eed72e93e0abc2ab586e3352b5ac76201b5cc" }], transforms: [{ type: "request.headers", op: "set", target: { key: "x-server-action-name" }, args: "app/actions/users.ts#updateUserRole" }] }, { src: "^/(.*)$", has: [{ type: "header", key: "next-action", value: "4084ecc248559434bbed7aaf47e0964909183b712b" }], transforms: [{ type: "request.headers", op: "set", target: { key: "x-server-action-name" }, args: "app/actions/users.ts#deleteUser" }] }, { src: "^/(.*)$", has: [{ type: "header", key: "next-action", value: "40120a4770f523906327ff10cb93fe6aad149f53d7" }], transforms: [{ type: "request.headers", op: "set", target: { key: "x-server-action-name" }, args: "app/actions/invitations.ts#revokeInvitation" }] }, { src: "^/(.*)$", has: [{ type: "header", key: "next-action", value: "00a5f02b38459aebc5d0a3d35a5e99e9dfd2756805" }], transforms: [{ type: "request.headers", op: "set", target: { key: "x-server-action-name" }, args: "app/actions/profile.ts#syncAllExistingAuthors" }] }, { src: "^/(.*)$", has: [{ type: "header", key: "next-action", value: "408166ddc5d6d1e3bdadd3a11d2455f364bffccac2" }], transforms: [{ type: "request.headers", op: "set", target: { key: "x-server-action-name" }, args: "app/actions/invitations.ts#inviteUser" }] }, { src: "^/(.*)$", has: [{ type: "header", key: "next-action", value: "404a3098b0152465cd6f31b843c9c376d3bcdce680" }], transforms: [{ type: "request.headers", op: "set", target: { key: "x-server-action-name" }, args: "app/actions/password-reset.ts#requestPasswordReset" }] }, { src: "^/(.*)$", has: [{ type: "header", key: "next-action", value: "60d7cbad4259a8685248574c743023795b93cab5de" }], transforms: [{ type: "request.headers", op: "set", target: { key: "x-server-action-name" }, args: "app/actions/password-reset.ts#resetPassword" }] }, { src: "^/(.*)$", has: [{ type: "header", key: "next-action", value: "70bd921982b1bca8533c53ce6511b1f4d90bfdf159" }], transforms: [{ type: "request.headers", op: "set", target: { key: "x-server-action-name" }, args: "app/actions/setup.ts#setupOwner" }] }, { src: "^/(.*)$", has: [{ type: "header", key: "next-action", value: "60fec4bc778e5028f5acb13e574fe4191498d37a90" }], transforms: [{ type: "request.headers", op: "set", target: { key: "x-server-action-name" }, args: "app/actions/invitations.ts#acceptInvitation" }] }, { src: "^/(.*)$", has: [{ type: "header", key: "next-action", value: "40bece66067b22733e45ce44899831973182db9f87" }], transforms: [{ type: "request.headers", op: "set", target: { key: "x-server-action-name" }, args: "app/actions/newsletter.ts#unsubscribeByToken" }] }, { continue: true, src: "^(?:\\/(_next\\/data\\/[^/]{1,}))?(?:\\/((?!_next\\/static|_next\\/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api).*))(\\.json|\\.rsc|\\.segments\\/.+\\.segment\\.rsc)?[\\/#\\?]?$", missing: [{ type: "header", key: "x-prerender-revalidate", value: "bd496422fb2dd8ecfe0f6fbc54f78003" }], middlewarePath: "middleware", middlewareRawSrc: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api).*)"], override: true }, { src: "^/$", has: [{ type: "header", key: "x-nextjs-data" }], dest: "/_next/data/9uNlunAtO2_V2KLLYQstZ/index.json", continue: true, override: true }, { src: "^/((?!_next/)(?:.*[^/]|.*))/?$", has: [{ type: "header", key: "x-nextjs-data" }], dest: "/_next/data/9uNlunAtO2_V2KLLYQstZ/$1.json", continue: true, override: true }, { src: "^/(?<path>.+?)(?:/)?$", dest: "/$path.segments/$segmentPath.segment.rsc", has: [{ type: "header", key: "rsc", value: "1" }, { type: "header", key: "next-router-prefetch", value: "1" }, { type: "header", key: "next-router-segment-prefetch", value: "/(?<segmentPath>.+)" }], continue: true, override: true }, { src: "^/?$", dest: "/index.segments/$segmentPath.segment.rsc", has: [{ type: "header", key: "rsc", value: "1" }, { type: "header", key: "next-router-prefetch", value: "1" }, { type: "header", key: "next-router-segment-prefetch", value: "/(?<segmentPath>.+)" }], continue: true, override: true }, { src: "^/?$", has: [{ type: "header", key: "rsc", value: "1" }], dest: "/index.rsc", headers: { vary: "rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch" }, continue: true, override: true }, { src: "^/((?!.+\\.rsc).+?)(?:/)?$", has: [{ type: "header", key: "rsc", value: "1" }], dest: "/$1.rsc", headers: { vary: "rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch" }, continue: true, override: true }], filesystem: [{ src: "^/_next/data/9uNlunAtO2_V2KLLYQstZ/(.*).json$", dest: "/$1", continue: true, has: [{ type: "header", key: "x-nextjs-data" }] }, { src: "^/index(?:/)?$", has: [{ type: "header", key: "x-nextjs-data" }], dest: "/", continue: true }, { src: "^/index(\\.action|\\.rsc)$", dest: "/", continue: true }, { src: "^/\\.prefetch\\.rsc$", dest: "/__index.prefetch.rsc", check: true }, { src: "^/(.+)/\\.prefetch\\.rsc$", dest: "/$1.prefetch.rsc", check: true }, { src: "^/\\.rsc$", dest: "/index.rsc", check: true }, { src: "^/(.+)/\\.rsc$", dest: "/$1.rsc", check: true }], miss: [{ src: "^/_next/static/.+$", status: 404, check: true, dest: "/_next/static/not-found.txt", headers: { "content-type": "text/plain; charset=utf-8" } }, { src: "^/(?<path>.+)(?<rscSuffix>\\.segments/.+\\.segment\\.rsc)(?:/)?$", dest: "/$path.rsc", check: true }], rewrite: [{ src: "^/$", has: [{ type: "header", key: "x-nextjs-data" }], dest: "/_next/data/9uNlunAtO2_V2KLLYQstZ/index.json", continue: true }, { src: "^/((?!_next/)(?:.*[^/]|.*))/?$", has: [{ type: "header", key: "x-nextjs-data" }], dest: "/_next/data/9uNlunAtO2_V2KLLYQstZ/$1.json", continue: true }, { src: "^/_next/data/9uNlunAtO2_V2KLLYQstZ/admin/articles/(?<nxtPid>[^/]+?)(?:/)?.json$", dest: "/admin/articles/[id]?nxtPid=$nxtPid", check: true, override: true }, { src: "^/_next/data/9uNlunAtO2_V2KLLYQstZ/admin/editor/(?<nxtPid>[^/]+?)(?:/)?.json$", dest: "/admin/editor/[id]?nxtPid=$nxtPid", check: true, override: true }, { src: "^/_next/data/9uNlunAtO2_V2KLLYQstZ/admin/review/(?<nxtPid>[^/]+?)(?:/)?.json$", dest: "/admin/review/[id]?nxtPid=$nxtPid", check: true, override: true }, { src: "^/_next/data/9uNlunAtO2_V2KLLYQstZ/api/auth/(?<nxtPnextauth>.+?)(?:/)?.json$", dest: "/api/auth/[...nextauth]?nxtPnextauth=$nxtPnextauth", check: true, override: true }, { src: "^/_next/data/9uNlunAtO2_V2KLLYQstZ/article/(?<nxtPslug>[^/]+?)(?:/)?.json$", dest: "/article/[slug]?nxtPslug=$nxtPslug", check: true, override: true }, { src: "^/_next/data/9uNlunAtO2_V2KLLYQstZ/author/(?<nxtPslug>[^/]+?)(?:/)?.json$", dest: "/author/[slug]?nxtPslug=$nxtPslug", check: true, override: true }, { src: "^/_next/data/9uNlunAtO2_V2KLLYQstZ/category/(?<nxtPslug>[^/]+?)(?:/)?.json$", dest: "/category/[slug]?nxtPslug=$nxtPslug", check: true, override: true }, { src: "^/_next/data/9uNlunAtO2_V2KLLYQstZ/invite/(?<nxtPtoken>[^/]+?)(?:/)?.json$", dest: "/invite/[token]?nxtPtoken=$nxtPtoken", check: true, override: true }, { src: "^/_next/data/9uNlunAtO2_V2KLLYQstZ/page/(?<nxtPslug>[^/]+?)(?:/)?.json$", dest: "/page/[slug]?nxtPslug=$nxtPslug", check: true, override: true }, { src: "^/_next/data/9uNlunAtO2_V2KLLYQstZ/preview/(?<nxtPid>[^/]+?)(?:/)?.json$", dest: "/preview/[id]?nxtPid=$nxtPid", check: true, override: true }, { src: "^/_next/data/9uNlunAtO2_V2KLLYQstZ/tag/(?<nxtPslug>[^/]+?)(?:/)?.json$", dest: "/tag/[slug]?nxtPslug=$nxtPslug", check: true, override: true }, { src: "^/_next/data/9uNlunAtO2_V2KLLYQstZ/unsubscribe/(?<nxtPtoken>[^/]+?)(?:/)?.json$", dest: "/unsubscribe/[token]?nxtPtoken=$nxtPtoken", check: true, override: true }, { src: "^/(?<path>.+)(?<rscSuffix>\\.segments/.+\\.segment\\.rsc)(?:/)?$", dest: "/$path.rsc", check: true, override: true }, { src: "^/admin/articles/(?<nxtPid>[^/]+?)(?<rscSuffix>\\.rsc|\\.prefetch\\.rsc|\\.segments/.+\\.segment\\.rsc)(?:/)?$", dest: "/admin/articles/[id]$rscSuffix?nxtPid=$nxtPid", check: true, override: true }, { src: "^/admin/articles/(?<nxtPid>[^/]+?)(?:/)?$", dest: "/admin/articles/[id]?nxtPid=$nxtPid", check: true, override: true }, { src: "^/admin/editor/(?<nxtPid>[^/]+?)(?<rscSuffix>\\.rsc|\\.prefetch\\.rsc|\\.segments/.+\\.segment\\.rsc)(?:/)?$", dest: "/admin/editor/[id]$rscSuffix?nxtPid=$nxtPid", check: true, override: true }, { src: "^/admin/editor/(?<nxtPid>[^/]+?)(?:/)?$", dest: "/admin/editor/[id]?nxtPid=$nxtPid", check: true, override: true }, { src: "^/admin/review/(?<nxtPid>[^/]+?)(?<rscSuffix>\\.rsc|\\.prefetch\\.rsc|\\.segments/.+\\.segment\\.rsc)(?:/)?$", dest: "/admin/review/[id]$rscSuffix?nxtPid=$nxtPid", check: true, override: true }, { src: "^/admin/review/(?<nxtPid>[^/]+?)(?:/)?$", dest: "/admin/review/[id]?nxtPid=$nxtPid", check: true, override: true }, { src: "^/api/auth/(?<nxtPnextauth>.+?)(?<rscSuffix>\\.rsc|\\.prefetch\\.rsc|\\.segments/.+\\.segment\\.rsc)(?:/)?$", dest: "/api/auth/[...nextauth]$rscSuffix?nxtPnextauth=$nxtPnextauth", check: true, override: true }, { src: "^/api/auth/(?<nxtPnextauth>.+?)(?:/)?$", dest: "/api/auth/[...nextauth]?nxtPnextauth=$nxtPnextauth", check: true, override: true }, { src: "^/article/(?<nxtPslug>[^/]+?)(?<rscSuffix>\\.rsc|\\.prefetch\\.rsc|\\.segments/.+\\.segment\\.rsc)(?:/)?$", dest: "/article/[slug]$rscSuffix?nxtPslug=$nxtPslug", check: true, override: true }, { src: "^/article/(?<nxtPslug>[^/]+?)(?:/)?$", dest: "/article/[slug]?nxtPslug=$nxtPslug", check: true, override: true }, { src: "^/author/(?<nxtPslug>[^/]+?)(?<rscSuffix>\\.rsc|\\.prefetch\\.rsc|\\.segments/.+\\.segment\\.rsc)(?:/)?$", dest: "/author/[slug]$rscSuffix?nxtPslug=$nxtPslug", check: true, override: true }, { src: "^/author/(?<nxtPslug>[^/]+?)(?:/)?$", dest: "/author/[slug]?nxtPslug=$nxtPslug", check: true, override: true }, { src: "^/category/(?<nxtPslug>[^/]+?)(?<rscSuffix>\\.rsc|\\.prefetch\\.rsc|\\.segments/.+\\.segment\\.rsc)(?:/)?$", dest: "/category/[slug]$rscSuffix?nxtPslug=$nxtPslug", check: true, override: true }, { src: "^/category/(?<nxtPslug>[^/]+?)(?:/)?$", dest: "/category/[slug]?nxtPslug=$nxtPslug", check: true, override: true }, { src: "^/invite/(?<nxtPtoken>[^/]+?)(?<rscSuffix>\\.rsc|\\.prefetch\\.rsc|\\.segments/.+\\.segment\\.rsc)(?:/)?$", dest: "/invite/[token]$rscSuffix?nxtPtoken=$nxtPtoken", check: true, override: true }, { src: "^/invite/(?<nxtPtoken>[^/]+?)(?:/)?$", dest: "/invite/[token]?nxtPtoken=$nxtPtoken", check: true, override: true }, { src: "^/page/(?<nxtPslug>[^/]+?)(?<rscSuffix>\\.rsc|\\.prefetch\\.rsc|\\.segments/.+\\.segment\\.rsc)(?:/)?$", dest: "/page/[slug]$rscSuffix?nxtPslug=$nxtPslug", check: true, override: true }, { src: "^/page/(?<nxtPslug>[^/]+?)(?:/)?$", dest: "/page/[slug]?nxtPslug=$nxtPslug", check: true, override: true }, { src: "^/preview/(?<nxtPid>[^/]+?)(?<rscSuffix>\\.rsc|\\.prefetch\\.rsc|\\.segments/.+\\.segment\\.rsc)(?:/)?$", dest: "/preview/[id]$rscSuffix?nxtPid=$nxtPid", check: true, override: true }, { src: "^/preview/(?<nxtPid>[^/]+?)(?:/)?$", dest: "/preview/[id]?nxtPid=$nxtPid", check: true, override: true }, { src: "^/tag/(?<nxtPslug>[^/]+?)(?<rscSuffix>\\.rsc|\\.prefetch\\.rsc|\\.segments/.+\\.segment\\.rsc)(?:/)?$", dest: "/tag/[slug]$rscSuffix?nxtPslug=$nxtPslug", check: true, override: true }, { src: "^/tag/(?<nxtPslug>[^/]+?)(?:/)?$", dest: "/tag/[slug]?nxtPslug=$nxtPslug", check: true, override: true }, { src: "^/unsubscribe/(?<nxtPtoken>[^/]+?)(?<rscSuffix>\\.rsc|\\.prefetch\\.rsc|\\.segments/.+\\.segment\\.rsc)(?:/)?$", dest: "/unsubscribe/[token]$rscSuffix?nxtPtoken=$nxtPtoken", check: true, override: true }, { src: "^/unsubscribe/(?<nxtPtoken>[^/]+?)(?:/)?$", dest: "/unsubscribe/[token]?nxtPtoken=$nxtPtoken", check: true, override: true }, { src: "^/_next/data/9uNlunAtO2_V2KLLYQstZ/(.*).json$", headers: { "x-nextjs-matched-path": "/$1" }, continue: true, override: true }, { src: "^/_next/data/9uNlunAtO2_V2KLLYQstZ/(.*).json$", dest: "__next_data_catchall" }], resource: [{ src: "^/.*$", status: 404 }], hit: [{ src: "^/_next/static/(?:[^/]+/pages|pages|chunks|runtime|css|image|media|9uNlunAtO2_V2KLLYQstZ)/.+$", headers: { "cache-control": "public,max-age=31536000,immutable" }, continue: true, important: true }, { src: "^/index(?:/)?$", headers: { "x-matched-path": "/" }, continue: true, important: true }, { src: "^/((?!index$).*?)(?:/)?$", headers: { "x-matched-path": "/$1" }, continue: true, important: true }], error: [{ src: "^/.*$", dest: "/404", status: 404, headers: { "x-next-error-status": "404" } }, { src: "^/.*$", dest: "/500", status: 500, headers: { "x-next-error-status": "500" } }] }, images: { domains: [], sizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840, 32, 48, 64, 96, 128, 256, 384], qualities: [75], remotePatterns: [{ protocol: "https", hostname: "^(?:(?!\\.)(?:(?:(?!(?:^|\\/)\\.).)*?)\\/?)$", pathname: "^(?:(?!(?:^|\\/)\\.{1,2}(?:\\/|$))(?:(?:(?!(?:^|\\/)\\.{1,2}(?:\\/|$)).)*?)\\/?)$" }, { protocol: "http", hostname: "^(?:(?!\\.)(?:(?:(?!(?:^|\\/)\\.).)*?)\\/?)$", pathname: "^(?:(?!(?:^|\\/)\\.{1,2}(?:\\/|$))(?:(?:(?!(?:^|\\/)\\.{1,2}(?:\\/|$)).)*?)\\/?)$" }], localPatterns: [{ pathname: "^(?:(?!(?:^|\\/)\\.{1,2}(?:\\/|$))(?:(?:(?!(?:^|\\/)\\.{1,2}(?:\\/|$)).)*?)\\/?)$", search: "" }], minimumCacheTTL: 14400, formats: ["image/webp"], dangerouslyAllowSVG: false, contentSecurityPolicy: "script-src 'none'; frame-src 'none'; sandbox;", contentDispositionType: "attachment" }, overrides: { "404.html": { path: "404", contentType: "text/html; charset=utf-8" }, "500.html": { path: "500", contentType: "text/html; charset=utf-8" }, "404.rsc.json": { path: "404.rsc", contentType: "application/json" }, "404.segments/_tree.segment.rsc.json": { path: "404.segments/_tree.segment.rsc", contentType: "application/json" }, "_app.rsc.json": { path: "_app.rsc", contentType: "application/json" }, "_app.segments/_tree.segment.rsc.json": { path: "_app.segments/_tree.segment.rsc", contentType: "application/json" }, "_document.rsc.json": { path: "_document.rsc", contentType: "application/json" }, "_document.segments/_tree.segment.rsc.json": { path: "_document.segments/_tree.segment.rsc", contentType: "application/json" }, "_error.rsc.json": { path: "_error.rsc", contentType: "application/json" }, "_error.segments/_tree.segment.rsc.json": { path: "_error.segments/_tree.segment.rsc", contentType: "application/json" }, "__next_data_catchall.json": { path: "__next_data_catchall", contentType: "application/json" }, "_next/static/not-found.txt": { contentType: "text/plain" } }, framework: { slug: "nextjs", version: "16.3.5" }, crons: [{ path: "/api/cron/publish-scheduled", schedule: "0 0 * * *" }] };
});
var h;
var d = T(() => {
  h = { "/404.html": { type: "override", path: "/404.html", headers: { "content-type": "text/html; charset=utf-8" } }, "/404.rsc.json": { type: "override", path: "/404.rsc.json", headers: { "content-type": "application/json" } }, "/404.segments/_tree.segment.rsc.json": { type: "override", path: "/404.segments/_tree.segment.rsc.json", headers: { "content-type": "application/json" } }, "/500.html": { type: "override", path: "/500.html", headers: { "content-type": "text/html; charset=utf-8" } }, "/__next_data_catchall.json": { type: "override", path: "/__next_data_catchall.json", headers: { "content-type": "application/json" } }, "/_app.rsc.json": { type: "override", path: "/_app.rsc.json", headers: { "content-type": "application/json" } }, "/_app.segments/_tree.segment.rsc.json": { type: "override", path: "/_app.segments/_tree.segment.rsc.json", headers: { "content-type": "application/json" } }, "/_document.rsc.json": { type: "override", path: "/_document.rsc.json", headers: { "content-type": "application/json" } }, "/_document.segments/_tree.segment.rsc.json": { type: "override", path: "/_document.segments/_tree.segment.rsc.json", headers: { "content-type": "application/json" } }, "/_error.rsc.json": { type: "override", path: "/_error.rsc.json", headers: { "content-type": "application/json" } }, "/_error.segments/_tree.segment.rsc.json": { type: "override", path: "/_error.segments/_tree.segment.rsc.json", headers: { "content-type": "application/json" } }, "/_next/static/9uNlunAtO2_V2KLLYQstZ/_buildManifest.js": { type: "static" }, "/_next/static/9uNlunAtO2_V2KLLYQstZ/_clientMiddlewareManifest.js": { type: "static" }, "/_next/static/9uNlunAtO2_V2KLLYQstZ/_ssgManifest.js": { type: "static" }, "/_next/static/chunks/0-4srap-ffvu1.js": { type: "static" }, "/_next/static/chunks/0-ewf9bn7-sq3.js": { type: "static" }, "/_next/static/chunks/0-yzry8yjlp3-.js": { type: "static" }, "/_next/static/chunks/00h58csdfefay.js": { type: "static" }, "/_next/static/chunks/00va8282c7viy.js": { type: "static" }, "/_next/static/chunks/01_remgex0cp2.js": { type: "static" }, "/_next/static/chunks/029j-9kj9o_rj.js": { type: "static" }, "/_next/static/chunks/039qr3juoj3nx.js": { type: "static" }, "/_next/static/chunks/03d_ia1a36wc9.js": { type: "static" }, "/_next/static/chunks/07iarns0noeru.js": { type: "static" }, "/_next/static/chunks/07iyga3syzy2_.js": { type: "static" }, "/_next/static/chunks/08xms7i32ib-s.js": { type: "static" }, "/_next/static/chunks/09oqp0k8ktr8m.js": { type: "static" }, "/_next/static/chunks/0a_kuude9z_bg.js": { type: "static" }, "/_next/static/chunks/0aee8d8cx9pl6.js": { type: "static" }, "/_next/static/chunks/0bz8pjqbx0nt7.js": { type: "static" }, "/_next/static/chunks/0cz1d0mv5g_q7.js": { type: "static" }, "/_next/static/chunks/0d24_m94_v71-.js": { type: "static" }, "/_next/static/chunks/0dheypymaguof.js": { type: "static" }, "/_next/static/chunks/0dmt3t0ig8-mx.js": { type: "static" }, "/_next/static/chunks/0if-vqkhyn-zc.js": { type: "static" }, "/_next/static/chunks/0j8ciicll_atc.js": { type: "static" }, "/_next/static/chunks/0jf8b10jsze-9.js": { type: "static" }, "/_next/static/chunks/0js0980_zun5b.js": { type: "static" }, "/_next/static/chunks/0kflrx4kej_oc.js": { type: "static" }, "/_next/static/chunks/0kl71d7x7e8sn.js": { type: "static" }, "/_next/static/chunks/0kur1_126ds-f.js": { type: "static" }, "/_next/static/chunks/0p4rcjkgaphdg.js": { type: "static" }, "/_next/static/chunks/0p54qye85am3w.js": { type: "static" }, "/_next/static/chunks/0pa5gye5z8cr-.js": { type: "static" }, "/_next/static/chunks/0pcpkmo6jx7kk.js": { type: "static" }, "/_next/static/chunks/0pdk3pp-q_rm4.js": { type: "static" }, "/_next/static/chunks/0pf2my1gc6hzd.js": { type: "static" }, "/_next/static/chunks/0q5tyevxl-ioe.js": { type: "static" }, "/_next/static/chunks/0r79_ebje0i6_.js": { type: "static" }, "/_next/static/chunks/0r_x880koxjth.js": { type: "static" }, "/_next/static/chunks/0sfauqlp8ehda.js": { type: "static" }, "/_next/static/chunks/0v9mich82_k2w.js": { type: "static" }, "/_next/static/chunks/0vhltcpdssl3-.js": { type: "static" }, "/_next/static/chunks/0wf0_2rpl0s9z.js": { type: "static" }, "/_next/static/chunks/0yxyl_g9rxka_.css": { type: "static" }, "/_next/static/chunks/0zf-ovfv80gtt.js": { type: "static" }, "/_next/static/chunks/1-6472auro00w.js": { type: "static" }, "/_next/static/chunks/11a2c-qgm8b37.js": { type: "static" }, "/_next/static/chunks/12cz_voukesha.js": { type: "static" }, "/_next/static/chunks/13awjgfr8ej7g.js": { type: "static" }, "/_next/static/chunks/13nn9spr9uit5.js": { type: "static" }, "/_next/static/chunks/15j97s3tp392o.js": { type: "static" }, "/_next/static/chunks/1815xwa8351ma.js": { type: "static" }, "/_next/static/chunks/19j_-rgrbkdwl.js": { type: "static" }, "/_next/static/chunks/1amxnyxfl21q_.js": { type: "static" }, "/_next/static/chunks/1b8bb040k39tl.js": { type: "static" }, "/_next/static/chunks/1de_4h39y61ce.js": { type: "static" }, "/_next/static/chunks/1jq5km52joacj.js": { type: "static" }, "/_next/static/chunks/1k40m5as9z__8.js": { type: "static" }, "/_next/static/chunks/1k7n146a77imr.js": { type: "static" }, "/_next/static/chunks/1kbzu9q1vl-0v.js": { type: "static" }, "/_next/static/chunks/1mi5igwf0bymk.js": { type: "static" }, "/_next/static/chunks/1nu0neut_shoj.js": { type: "static" }, "/_next/static/chunks/1nwmzkm0nr--f.js": { type: "static" }, "/_next/static/chunks/1o8w8-vrc036b.js": { type: "static" }, "/_next/static/chunks/1oub28u2g_5gv.js": { type: "static" }, "/_next/static/chunks/1p--jp91_7m7o.js": { type: "static" }, "/_next/static/chunks/1qapeyh3r6cg3.js": { type: "static" }, "/_next/static/chunks/1qi7k63ap-vrk.js": { type: "static" }, "/_next/static/chunks/1qzpnq74a_gnb.js": { type: "static" }, "/_next/static/chunks/1temk7pdiryml.js": { type: "static" }, "/_next/static/chunks/1v15lv0fcel0n.js": { type: "static" }, "/_next/static/chunks/1vxr9kioh9sz7.css": { type: "static" }, "/_next/static/chunks/1w0bfudnr_okk.js": { type: "static" }, "/_next/static/chunks/1x6f-1kfdc7-e.js": { type: "static" }, "/_next/static/chunks/1xg-kfrv-xv6v.js": { type: "static" }, "/_next/static/chunks/1ya8vp4-7hsvb.js": { type: "static" }, "/_next/static/chunks/1zi8-fjmgt7lx.js": { type: "static" }, "/_next/static/chunks/1zz5m2ob0w_hr.js": { type: "static" }, "/_next/static/chunks/2-6wy3rrcjk_m.js": { type: "static" }, "/_next/static/chunks/2-7-cr6gj0tmm.js": { type: "static" }, "/_next/static/chunks/2-urkx3cuhmdn.js": { type: "static" }, "/_next/static/chunks/218shkmnr9ja_.js": { type: "static" }, "/_next/static/chunks/21jyuvv3rp_eo.js": { type: "static" }, "/_next/static/chunks/21o6_7520je3e.js": { type: "static" }, "/_next/static/chunks/2229oikqtsjnx.js": { type: "static" }, "/_next/static/chunks/22pzlrxuotq9f.js": { type: "static" }, "/_next/static/chunks/25d8z1dtajjos.js": { type: "static" }, "/_next/static/chunks/25wx50f5ge75i.js": { type: "static" }, "/_next/static/chunks/26rz_qkwx39lp.js": { type: "static" }, "/_next/static/chunks/27ag7-c9a81uz.js": { type: "static" }, "/_next/static/chunks/27vxnejvik-kz.js": { type: "static" }, "/_next/static/chunks/2_5wnbf901r73.js": { type: "static" }, "/_next/static/chunks/2_i6kysvgofuu.js": { type: "static" }, "/_next/static/chunks/2_rd5ej_wdlov.js": { type: "static" }, "/_next/static/chunks/2b57kmz64uj8h.js": { type: "static" }, "/_next/static/chunks/2die_jjdv3lp_.js": { type: "static" }, "/_next/static/chunks/2ehcoe53ptxcl.js": { type: "static" }, "/_next/static/chunks/2g3-zyq-9gsz-.js": { type: "static" }, "/_next/static/chunks/2govky-gpj_6k.js": { type: "static" }, "/_next/static/chunks/2gu2ydqvais8s.js": { type: "static" }, "/_next/static/chunks/2jq60zcf_gq4t.js": { type: "static" }, "/_next/static/chunks/2jzaw7p12l187.js": { type: "static" }, "/_next/static/chunks/2li_31_ssbg_u.js": { type: "static" }, "/_next/static/chunks/2ls5c2l08l6uw.js": { type: "static" }, "/_next/static/chunks/2luc89azt200z.js": { type: "static" }, "/_next/static/chunks/2n8a-nqwp8egh.js": { type: "static" }, "/_next/static/chunks/2qq7e47gpyc_e.js": { type: "static" }, "/_next/static/chunks/2r0lw456xcg6b.js": { type: "static" }, "/_next/static/chunks/2re701zfx-nrj.js": { type: "static" }, "/_next/static/chunks/2stfsye6-gk13.js": { type: "static" }, "/_next/static/chunks/2u1sc-uhfeuz-.js": { type: "static" }, "/_next/static/chunks/2w3qe--k1et2_.js": { type: "static" }, "/_next/static/chunks/2x7a4fxw54xw0.js": { type: "static" }, "/_next/static/chunks/2x8j4hf7cf6ds.js": { type: "static" }, "/_next/static/chunks/2xze3_g9fb_77.js": { type: "static" }, "/_next/static/chunks/2zlyrwma454ve.js": { type: "static" }, "/_next/static/chunks/3-cgqtdjpbipb.js": { type: "static" }, "/_next/static/chunks/30bfnwpii5sy_.js": { type: "static" }, "/_next/static/chunks/31etpuynk3lai.js": { type: "static" }, "/_next/static/chunks/37jk27oi4rzta.js": { type: "static" }, "/_next/static/chunks/38nlulm72pod6.js": { type: "static" }, "/_next/static/chunks/390j8su-qymlu.js": { type: "static" }, "/_next/static/chunks/39p8xw2j2jgtw.js": { type: "static" }, "/_next/static/chunks/3bj-g9gi7x9fh.js": { type: "static" }, "/_next/static/chunks/3dnnnd35jb32z.js": { type: "static" }, "/_next/static/chunks/3f7k5tx6cchl5.js": { type: "static" }, "/_next/static/chunks/3f7lxsmb2gvmb.js": { type: "static" }, "/_next/static/chunks/3gev5-8hdpbds.js": { type: "static" }, "/_next/static/chunks/3gh7894326-f8.js": { type: "static" }, "/_next/static/chunks/3gori_-b9fdt2.js": { type: "static" }, "/_next/static/chunks/3haahg1bz486x.js": { type: "static" }, "/_next/static/chunks/3hoywvu-focex.js": { type: "static" }, "/_next/static/chunks/3irbnvtih2qg9.js": { type: "static" }, "/_next/static/chunks/3kv3em8nrbya2.js": { type: "static" }, "/_next/static/chunks/3l6bwn061vy22.js": { type: "static" }, "/_next/static/chunks/3n80kknp-eoi9.js": { type: "static" }, "/_next/static/chunks/3nwgurdesknpx.js": { type: "static" }, "/_next/static/chunks/3tfyfqj6ld2vi.js": { type: "static" }, "/_next/static/chunks/3u0z7qpueg1dz.js": { type: "static" }, "/_next/static/chunks/3ui2c1djuves1.js": { type: "static" }, "/_next/static/chunks/3vkprq1qh4d8x.js": { type: "static" }, "/_next/static/chunks/3vozyk4fomaq5.js": { type: "static" }, "/_next/static/chunks/3vwbjfl6-yep1.js": { type: "static" }, "/_next/static/chunks/3w3vyas0-ls3x.js": { type: "static" }, "/_next/static/chunks/3w5gsie2472pe.js": { type: "static" }, "/_next/static/chunks/3wtbz-kg_i22l.js": { type: "static" }, "/_next/static/chunks/3x0up5lkhhwk_.js": { type: "static" }, "/_next/static/chunks/3xpl8lronogk9.js": { type: "static" }, "/_next/static/chunks/3za381004mjtm.js": { type: "static" }, "/_next/static/chunks/411-m6wb1xycs.js": { type: "static" }, "/_next/static/chunks/4174fjcyu4hzv.js": { type: "static" }, "/_next/static/chunks/41r6lojo50nzh.js": { type: "static" }, "/_next/static/chunks/41uertskgrvwu.js": { type: "static" }, "/_next/static/chunks/42c_59_xrlwpf.js": { type: "static" }, "/_next/static/chunks/43s0b2zjt02q9.js": { type: "static" }, "/_next/static/chunks/44wu1-ukmpqm5.js": { type: "static" }, "/_next/static/chunks/4558t_0mgc5j4.js": { type: "static" }, "/_next/static/chunks/turbopack-1j9qhvwo7l9t_.js": { type: "static" }, "/_next/static/chunks/turbopack-2iqcb17-w162s.js": { type: "static" }, "/_next/static/chunks/turbopack-2kq0m8bv9r8n8.js": { type: "static" }, "/_next/static/chunks/turbopack-2w-7lw2urxj9b.js": { type: "static" }, "/_next/static/media/0b1dc8ddaa74ba49-s.0e__wj8580tc5.woff2": { type: "static" }, "/_next/static/media/0c89a48fa5027cee-s.p.2cyn07wtgehh0.woff2": { type: "static" }, "/_next/static/media/13bf9871fe164e7f-s.2f7nqdagzwx2-.woff2": { type: "static" }, "/_next/static/media/1a099d89ee94ee96-s.35a5cae5tspm2.woff2": { type: "static" }, "/_next/static/media/28868e710e86be81-s.2eksvhm1z0jwa.woff2": { type: "static" }, "/_next/static/media/32687112bd2dd8db-s.1gepa_7fcx9fm.woff2": { type: "static" }, "/_next/static/media/3fe682a82f50d426-s.0vfdmo25voy_0.woff2": { type: "static" }, "/_next/static/media/70bc3e132a0a741e-s.p.3t6q91iet4nsy.woff2": { type: "static" }, "/_next/static/media/71b036adf157cdcf-s.0bp8oijd_gu96.woff2": { type: "static" }, "/_next/static/media/89b21bb081cb7469-s.1fby2rem9ngyr.woff2": { type: "static" }, "/_next/static/media/cc545e633e20c56d-s.176arc174-8zp.woff2": { type: "static" }, "/_next/static/media/e629b5bc06499d58-s.10u7vx61f1ie7.woff2": { type: "static" }, "/_next/static/media/fba5a26ea33df6a3-s.p.18rizl4rsrl42.woff2": { type: "static" }, "/_next/static/media/kremlin-s.p.0bi5vcflwd23v.woff2": { type: "static" }, "/_next/static/not-found.txt": { type: "static" }, "/amk.webp": { type: "static" }, "/anwar.webp": { type: "static" }, "/apple-icon.png": { type: "static" }, "/apple-touch-icon.png": { type: "static" }, "/favicon.ico": { type: "static" }, "/file.svg": { type: "static" }, "/fonts/README.md": { type: "static" }, "/globe.svg": { type: "static" }, "/icon.svg": { type: "static" }, "/km.webp": { type: "static" }, "/next.svg": { type: "static" }, "/robots.txt": { type: "override", path: "/robots.txt", headers: { "cache-control": "public, max-age=0, must-revalidate", "content-type": "text/plain", "x-next-cache-tags": "_N_T_/layout,_N_T_/robots.txt/layout,_N_T_/robots.txt/route,_N_T_/robots.txt", vary: "rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch" } }, "/tariq.webp": { type: "static" }, "/vercel.svg": { type: "static" }, "/window.svg": { type: "static" }, "/xsypher-logo-full.png": { type: "static" }, "/xsypher-logo-full.svg": { type: "static" }, "/.well-known/security.txt": { type: "function", entrypoint: "__next-on-pages-dist__/functions/.well-known/security.txt.func.js" }, "/.well-known/security.txt.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/.well-known/security.txt.func.js" }, "/_not-found": { type: "function", entrypoint: "__next-on-pages-dist__/functions/_not-found.func.js" }, "/_not-found.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/_not-found.func.js" }, "/admin/articles/[id]": { type: "function", entrypoint: "__next-on-pages-dist__/functions/admin/articles/[id].func.js" }, "/admin/articles/[id].rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/admin/articles/[id].func.js" }, "/admin/articles": { type: "function", entrypoint: "__next-on-pages-dist__/functions/admin/articles.func.js" }, "/admin/articles.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/admin/articles.func.js" }, "/admin/audit-logs": { type: "function", entrypoint: "__next-on-pages-dist__/functions/admin/audit-logs.func.js" }, "/admin/audit-logs.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/admin/audit-logs.func.js" }, "/admin/authors": { type: "function", entrypoint: "__next-on-pages-dist__/functions/admin/authors.func.js" }, "/admin/authors.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/admin/authors.func.js" }, "/admin/comments": { type: "function", entrypoint: "__next-on-pages-dist__/functions/admin/comments.func.js" }, "/admin/comments.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/admin/comments.func.js" }, "/admin/drafts": { type: "function", entrypoint: "__next-on-pages-dist__/functions/admin/drafts.func.js" }, "/admin/drafts.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/admin/drafts.func.js" }, "/admin/editor/[id]": { type: "function", entrypoint: "__next-on-pages-dist__/functions/admin/editor/[id].func.js" }, "/admin/editor/[id].rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/admin/editor/[id].func.js" }, "/admin/editor": { type: "function", entrypoint: "__next-on-pages-dist__/functions/admin/editor.func.js" }, "/admin/editor.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/admin/editor.func.js" }, "/admin/forgot-password": { type: "function", entrypoint: "__next-on-pages-dist__/functions/admin/forgot-password.func.js" }, "/admin/forgot-password.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/admin/forgot-password.func.js" }, "/admin/login": { type: "function", entrypoint: "__next-on-pages-dist__/functions/admin/login.func.js" }, "/admin/login.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/admin/login.func.js" }, "/admin/media": { type: "function", entrypoint: "__next-on-pages-dist__/functions/admin/media.func.js" }, "/admin/media.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/admin/media.func.js" }, "/admin/reset-password": { type: "function", entrypoint: "__next-on-pages-dist__/functions/admin/reset-password.func.js" }, "/admin/reset-password.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/admin/reset-password.func.js" }, "/admin/review/[id]": { type: "function", entrypoint: "__next-on-pages-dist__/functions/admin/review/[id].func.js" }, "/admin/review/[id].rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/admin/review/[id].func.js" }, "/admin/review": { type: "function", entrypoint: "__next-on-pages-dist__/functions/admin/review.func.js" }, "/admin/review.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/admin/review.func.js" }, "/admin/settings": { type: "function", entrypoint: "__next-on-pages-dist__/functions/admin/settings.func.js" }, "/admin/settings.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/admin/settings.func.js" }, "/admin/setup": { type: "function", entrypoint: "__next-on-pages-dist__/functions/admin/setup.func.js" }, "/admin/setup.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/admin/setup.func.js" }, "/admin/submissions": { type: "function", entrypoint: "__next-on-pages-dist__/functions/admin/submissions.func.js" }, "/admin/submissions.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/admin/submissions.func.js" }, "/admin/subscribers": { type: "function", entrypoint: "__next-on-pages-dist__/functions/admin/subscribers.func.js" }, "/admin/subscribers.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/admin/subscribers.func.js" }, "/admin/taxonomy": { type: "function", entrypoint: "__next-on-pages-dist__/functions/admin/taxonomy.func.js" }, "/admin/taxonomy.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/admin/taxonomy.func.js" }, "/admin/users/invite": { type: "function", entrypoint: "__next-on-pages-dist__/functions/admin/users/invite.func.js" }, "/admin/users/invite.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/admin/users/invite.func.js" }, "/admin/users": { type: "function", entrypoint: "__next-on-pages-dist__/functions/admin/users.func.js" }, "/admin/users.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/admin/users.func.js" }, "/admin": { type: "function", entrypoint: "__next-on-pages-dist__/functions/admin.func.js" }, "/admin.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/admin.func.js" }, "/api/article/upsert": { type: "function", entrypoint: "__next-on-pages-dist__/functions/api/article/upsert.func.js" }, "/api/article/upsert.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/api/article/upsert.func.js" }, "/api/article/workflow": { type: "function", entrypoint: "__next-on-pages-dist__/functions/api/article/workflow.func.js" }, "/api/article/workflow.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/api/article/workflow.func.js" }, "/api/auth/[...nextauth]": { type: "function", entrypoint: "__next-on-pages-dist__/functions/api/auth/[...nextauth].func.js" }, "/api/auth/[...nextauth].rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/api/auth/[...nextauth].func.js" }, "/api/comments": { type: "function", entrypoint: "__next-on-pages-dist__/functions/api/comments.func.js" }, "/api/comments.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/api/comments.func.js" }, "/api/cron/publish-scheduled": { type: "function", entrypoint: "__next-on-pages-dist__/functions/api/cron/publish-scheduled.func.js" }, "/api/cron/publish-scheduled.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/api/cron/publish-scheduled.func.js" }, "/api/debug": { type: "function", entrypoint: "__next-on-pages-dist__/functions/api/debug.func.js" }, "/api/debug.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/api/debug.func.js" }, "/api/subscribe": { type: "function", entrypoint: "__next-on-pages-dist__/functions/api/subscribe.func.js" }, "/api/subscribe.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/api/subscribe.func.js" }, "/api/taxonomy": { type: "function", entrypoint: "__next-on-pages-dist__/functions/api/taxonomy.func.js" }, "/api/taxonomy.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/api/taxonomy.func.js" }, "/api/upload/avatar": { type: "function", entrypoint: "__next-on-pages-dist__/functions/api/upload/avatar.func.js" }, "/api/upload/avatar.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/api/upload/avatar.func.js" }, "/api/upload/external": { type: "function", entrypoint: "__next-on-pages-dist__/functions/api/upload/external.func.js" }, "/api/upload/external.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/api/upload/external.func.js" }, "/api/upload": { type: "function", entrypoint: "__next-on-pages-dist__/functions/api/upload.func.js" }, "/api/upload.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/api/upload.func.js" }, "/article/[slug]": { type: "function", entrypoint: "__next-on-pages-dist__/functions/article/[slug].func.js" }, "/article/[slug].rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/article/[slug].func.js" }, "/author/[slug]": { type: "function", entrypoint: "__next-on-pages-dist__/functions/author/[slug].func.js" }, "/author/[slug].rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/author/[slug].func.js" }, "/category/[slug]": { type: "function", entrypoint: "__next-on-pages-dist__/functions/category/[slug].func.js" }, "/category/[slug].rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/category/[slug].func.js" }, "/feed.xml": { type: "function", entrypoint: "__next-on-pages-dist__/functions/feed.xml.func.js" }, "/feed.xml.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/feed.xml.func.js" }, "/index": { type: "function", entrypoint: "__next-on-pages-dist__/functions/index.func.js" }, "/": { type: "function", entrypoint: "__next-on-pages-dist__/functions/index.func.js" }, "/index.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/index.func.js" }, "/invite/[token]": { type: "function", entrypoint: "__next-on-pages-dist__/functions/invite/[token].func.js" }, "/invite/[token].rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/invite/[token].func.js" }, "/latest": { type: "function", entrypoint: "__next-on-pages-dist__/functions/latest.func.js" }, "/latest.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/latest.func.js" }, "/page/[slug]": { type: "function", entrypoint: "__next-on-pages-dist__/functions/page/[slug].func.js" }, "/page/[slug].rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/page/[slug].func.js" }, "/page/about": { type: "function", entrypoint: "__next-on-pages-dist__/functions/page/about.func.js" }, "/page/about.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/page/about.func.js" }, "/page/accessibility": { type: "function", entrypoint: "__next-on-pages-dist__/functions/page/accessibility.func.js" }, "/page/accessibility.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/page/accessibility.func.js" }, "/page/advertising": { type: "function", entrypoint: "__next-on-pages-dist__/functions/page/advertising.func.js" }, "/page/advertising.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/page/advertising.func.js" }, "/page/careers": { type: "function", entrypoint: "__next-on-pages-dist__/functions/page/careers.func.js" }, "/page/careers.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/page/careers.func.js" }, "/page/contact": { type: "function", entrypoint: "__next-on-pages-dist__/functions/page/contact.func.js" }, "/page/contact.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/page/contact.func.js" }, "/page/cookie-policy": { type: "function", entrypoint: "__next-on-pages-dist__/functions/page/cookie-policy.func.js" }, "/page/cookie-policy.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/page/cookie-policy.func.js" }, "/page/corrections": { type: "function", entrypoint: "__next-on-pages-dist__/functions/page/corrections.func.js" }, "/page/corrections.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/page/corrections.func.js" }, "/page/disclaimer": { type: "function", entrypoint: "__next-on-pages-dist__/functions/page/disclaimer.func.js" }, "/page/disclaimer.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/page/disclaimer.func.js" }, "/page/editorial-policy": { type: "function", entrypoint: "__next-on-pages-dist__/functions/page/editorial-policy.func.js" }, "/page/editorial-policy.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/page/editorial-policy.func.js" }, "/page/editorial-standards": { type: "function", entrypoint: "__next-on-pages-dist__/functions/page/editorial-standards.func.js" }, "/page/editorial-standards.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/page/editorial-standards.func.js" }, "/page/media-kit": { type: "function", entrypoint: "__next-on-pages-dist__/functions/page/media-kit.func.js" }, "/page/media-kit.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/page/media-kit.func.js" }, "/page/newsletters": { type: "function", entrypoint: "__next-on-pages-dist__/functions/page/newsletters.func.js" }, "/page/newsletters.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/page/newsletters.func.js" }, "/page/privacy-policy": { type: "function", entrypoint: "__next-on-pages-dist__/functions/page/privacy-policy.func.js" }, "/page/privacy-policy.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/page/privacy-policy.func.js" }, "/page/sitemap": { type: "function", entrypoint: "__next-on-pages-dist__/functions/page/sitemap.func.js" }, "/page/sitemap.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/page/sitemap.func.js" }, "/page/terms-of-use": { type: "function", entrypoint: "__next-on-pages-dist__/functions/page/terms-of-use.func.js" }, "/page/terms-of-use.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/page/terms-of-use.func.js" }, "/page/transparency": { type: "function", entrypoint: "__next-on-pages-dist__/functions/page/transparency.func.js" }, "/page/transparency.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/page/transparency.func.js" }, "/preview/[id]": { type: "function", entrypoint: "__next-on-pages-dist__/functions/preview/[id].func.js" }, "/preview/[id].rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/preview/[id].func.js" }, "/search": { type: "function", entrypoint: "__next-on-pages-dist__/functions/search.func.js" }, "/search.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/search.func.js" }, "/series": { type: "function", entrypoint: "__next-on-pages-dist__/functions/series.func.js" }, "/series.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/series.func.js" }, "/sitemap.xml": { type: "function", entrypoint: "__next-on-pages-dist__/functions/sitemap.xml.func.js" }, "/sitemap.xml.rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/sitemap.xml.func.js" }, "/tag/[slug]": { type: "function", entrypoint: "__next-on-pages-dist__/functions/tag/[slug].func.js" }, "/tag/[slug].rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/tag/[slug].func.js" }, "/unsubscribe/[token]": { type: "function", entrypoint: "__next-on-pages-dist__/functions/unsubscribe/[token].func.js" }, "/unsubscribe/[token].rsc": { type: "function", entrypoint: "__next-on-pages-dist__/functions/unsubscribe/[token].func.js" }, "/404": { type: "override", path: "/404.html", headers: { "content-type": "text/html; charset=utf-8" } }, "/500": { type: "override", path: "/500.html", headers: { "content-type": "text/html; charset=utf-8" } }, "/404.rsc": { type: "override", path: "/404.rsc.json", headers: { "content-type": "application/json" } }, "/404.segments/_tree.segment.rsc": { type: "override", path: "/404.segments/_tree.segment.rsc.json", headers: { "content-type": "application/json" } }, "/_app.rsc": { type: "override", path: "/_app.rsc.json", headers: { "content-type": "application/json" } }, "/_app.segments/_tree.segment.rsc": { type: "override", path: "/_app.segments/_tree.segment.rsc.json", headers: { "content-type": "application/json" } }, "/_document.rsc": { type: "override", path: "/_document.rsc.json", headers: { "content-type": "application/json" } }, "/_document.segments/_tree.segment.rsc": { type: "override", path: "/_document.segments/_tree.segment.rsc.json", headers: { "content-type": "application/json" } }, "/_error.rsc": { type: "override", path: "/_error.rsc.json", headers: { "content-type": "application/json" } }, "/_error.segments/_tree.segment.rsc": { type: "override", path: "/_error.segments/_tree.segment.rsc.json", headers: { "content-type": "application/json" } }, "/__next_data_catchall": { type: "override", path: "/__next_data_catchall.json", headers: { "content-type": "application/json" } }, middleware: { type: "middleware", entrypoint: "__next-on-pages-dist__/functions/middleware.func.js" } };
});
var $ = H((Wt, V) => {
  "use strict";
  u();
  p();
  d();
  function j(t, e) {
    t = String(t || "").trim();
    let n = t, s, a = "";
    if (/^[^a-zA-Z\\\s]/.test(t)) {
      s = t[0];
      let r = t.lastIndexOf(s);
      a += t.substring(r + 1), t = t.substring(1, r);
    }
    let i = 0;
    return t = dt(t, (r) => {
      if (/^\(\?[P<']/.test(r)) {
        let o = /^\(\?P?[<']([^>']+)[>']/.exec(r);
        if (!o) throw new Error(`Failed to extract named captures from ${JSON.stringify(r)}`);
        let l = r.substring(o[0].length, r.length - 1);
        return e && (e[i] = o[1]), i++, `(${l})`;
      }
      return r.substring(0, 3) === "(?:" || i++, r;
    }), t = t.replace(/\[:([^:]+):\]/g, (r, o) => j.characterClasses[o] || r), new j.PCRE(t, a, n, a, s);
  }
  __name(j, "j");
  function dt(t, e) {
    let n = 0, s = 0, a = false;
    for (let c = 0; c < t.length; c++) {
      let i = t[c];
      if (a) {
        a = false;
        continue;
      }
      switch (i) {
        case "(":
          s === 0 && (n = c), s++;
          break;
        case ")":
          if (s > 0 && (s--, s === 0)) {
            let r = c + 1, o = n === 0 ? "" : t.substring(0, n), l = t.substring(r), f = String(e(t.substring(n, r)));
            t = o + f + l, c = n;
          }
          break;
        case "\\":
          a = true;
          break;
        default:
          break;
      }
    }
    return t;
  }
  __name(dt, "dt");
  (function(t) {
    class e extends RegExp {
      static {
        __name(this, "e");
      }
      constructor(s, a, c, i, r) {
        super(s, a), this.pcrePattern = c, this.pcreFlags = i, this.delimiter = r;
      }
    }
    t.PCRE = e, t.characterClasses = { alnum: "[A-Za-z0-9]", word: "[A-Za-z0-9_]", alpha: "[A-Za-z]", blank: "[ \\t]", cntrl: "[\\x00-\\x1F\\x7F]", digit: "\\d", graph: "[\\x21-\\x7E]", lower: "[a-z]", print: "[\\x20-\\x7E]", punct: "[\\]\\[!\"#$%&'()*+,./:;<=>?@\\\\^_`{|}~-]", space: "\\s", upper: "[A-Z]", xdigit: "[A-Fa-f0-9]" };
  })(j || (j = {}));
  j.prototype = j.PCRE.prototype;
  V.exports = j;
});
var X = H((N) => {
  "use strict";
  u();
  p();
  d();
  N.parse = bt;
  N.serialize = vt;
  var wt = Object.prototype.toString, E = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;
  function bt(t, e) {
    if (typeof t != "string") throw new TypeError("argument str must be a string");
    for (var n = {}, s = e || {}, a = s.decode || Rt, c = 0; c < t.length; ) {
      var i = t.indexOf("=", c);
      if (i === -1) break;
      var r = t.indexOf(";", c);
      if (r === -1) r = t.length;
      else if (r < i) {
        c = t.lastIndexOf(";", i - 1) + 1;
        continue;
      }
      var o = t.slice(c, i).trim();
      if (n[o] === void 0) {
        var l = t.slice(i + 1, r).trim();
        l.charCodeAt(0) === 34 && (l = l.slice(1, -1)), n[o] = Ct(l, a);
      }
      c = r + 1;
    }
    return n;
  }
  __name(bt, "bt");
  function vt(t, e, n) {
    var s = n || {}, a = s.encode || Pt;
    if (typeof a != "function") throw new TypeError("option encode is invalid");
    if (!E.test(t)) throw new TypeError("argument name is invalid");
    var c = a(e);
    if (c && !E.test(c)) throw new TypeError("argument val is invalid");
    var i = t + "=" + c;
    if (s.maxAge != null) {
      var r = s.maxAge - 0;
      if (isNaN(r) || !isFinite(r)) throw new TypeError("option maxAge is invalid");
      i += "; Max-Age=" + Math.floor(r);
    }
    if (s.domain) {
      if (!E.test(s.domain)) throw new TypeError("option domain is invalid");
      i += "; Domain=" + s.domain;
    }
    if (s.path) {
      if (!E.test(s.path)) throw new TypeError("option path is invalid");
      i += "; Path=" + s.path;
    }
    if (s.expires) {
      var o = s.expires;
      if (!St(o) || isNaN(o.valueOf())) throw new TypeError("option expires is invalid");
      i += "; Expires=" + o.toUTCString();
    }
    if (s.httpOnly && (i += "; HttpOnly"), s.secure && (i += "; Secure"), s.priority) {
      var l = typeof s.priority == "string" ? s.priority.toLowerCase() : s.priority;
      switch (l) {
        case "low":
          i += "; Priority=Low";
          break;
        case "medium":
          i += "; Priority=Medium";
          break;
        case "high":
          i += "; Priority=High";
          break;
        default:
          throw new TypeError("option priority is invalid");
      }
    }
    if (s.sameSite) {
      var f = typeof s.sameSite == "string" ? s.sameSite.toLowerCase() : s.sameSite;
      switch (f) {
        case true:
          i += "; SameSite=Strict";
          break;
        case "lax":
          i += "; SameSite=Lax";
          break;
        case "strict":
          i += "; SameSite=Strict";
          break;
        case "none":
          i += "; SameSite=None";
          break;
        default:
          throw new TypeError("option sameSite is invalid");
      }
    }
    return i;
  }
  __name(vt, "vt");
  function Rt(t) {
    return t.indexOf("%") !== -1 ? decodeURIComponent(t) : t;
  }
  __name(Rt, "Rt");
  function Pt(t) {
    return encodeURIComponent(t);
  }
  __name(Pt, "Pt");
  function St(t) {
    return wt.call(t) === "[object Date]" || t instanceof Date;
  }
  __name(St, "St");
  function Ct(t, e) {
    try {
      return e(t);
    } catch {
      return t;
    }
  }
  __name(Ct, "Ct");
});
u();
p();
d();
u();
p();
d();
u();
p();
d();
var w = "INTERNAL_SUSPENSE_CACHE_HOSTNAME.local";
u();
p();
d();
u();
p();
d();
u();
p();
d();
u();
p();
d();
var F = U($());
function P(t, e, n) {
  if (e == null) return { match: null, captureGroupKeys: [] };
  let s = n ? "" : "i", a = [];
  return { match: (0, F.default)(`%${t}%${s}`, a).exec(e), captureGroupKeys: a };
}
__name(P, "P");
function b(t, e, n, { namedOnly: s } = {}) {
  return t.replace(/\$([a-zA-Z0-9_]+)/g, (a, c) => {
    let i = n.indexOf(c);
    return s && i === -1 ? a : (i === -1 ? e[parseInt(c, 10)] : e[i + 1]) || "";
  });
}
__name(b, "b");
function I(t, { url: e, cookies: n, headers: s, routeDest: a }) {
  switch (t.type) {
    case "host":
      return { valid: e.hostname === t.value };
    case "header":
      return t.value !== void 0 ? q(t.value, s.get(t.key), a) : { valid: s.has(t.key) };
    case "cookie": {
      let c = n[t.key];
      return c && t.value !== void 0 ? q(t.value, c, a) : { valid: c !== void 0 };
    }
    case "query":
      return t.value !== void 0 ? q(t.value, e.searchParams.get(t.key), a) : { valid: e.searchParams.has(t.key) };
  }
}
__name(I, "I");
function q(t, e, n) {
  let { match: s, captureGroupKeys: a } = P(t, e);
  return n && s && a.length ? { valid: !!s, newRouteDest: b(n, s, a, { namedOnly: true }) } : { valid: !!s };
}
__name(q, "q");
u();
p();
d();
function D(t) {
  let e = new Headers(t.headers);
  return t.cf && (e.set("x-vercel-ip-city", encodeURIComponent(t.cf.city)), e.set("x-vercel-ip-country", t.cf.country), e.set("x-vercel-ip-country-region", t.cf.regionCode), e.set("x-vercel-ip-latitude", t.cf.latitude), e.set("x-vercel-ip-longitude", t.cf.longitude)), e.set("x-vercel-sc-host", w), new Request(t, { headers: e });
}
__name(D, "D");
u();
p();
d();
function m(t, e, n) {
  let s = e instanceof Headers ? e.entries() : Object.entries(e);
  for (let [a, c] of s) {
    let i = a.toLowerCase(), r = n?.match ? b(c, n.match, n.captureGroupKeys) : c;
    i === "set-cookie" ? t.append(i, r) : t.set(i, r);
  }
}
__name(m, "m");
function v(t) {
  return /^https?:\/\//.test(t);
}
__name(v, "v");
function x(t, e) {
  for (let [n, s] of e.entries()) {
    let a = /^nxtP(.+)$/.exec(n), c = /^nxtI(.+)$/.exec(n);
    a?.[1] ? (t.set(n, s), t.set(a[1], s)) : c?.[1] ? t.set(c[1], s.replace(/(\(\.+\))+/, "")) : (!t.has(n) || !!s && !t.getAll(n).includes(s)) && t.append(n, s);
  }
}
__name(x, "x");
function L(t, e) {
  let n = new URL(e, t.url);
  return x(n.searchParams, new URL(t.url).searchParams), n.pathname = n.pathname.replace(/\/index.html$/, "/").replace(/\.html$/, ""), new Request(n, t);
}
__name(L, "L");
function R(t) {
  return new Response(t.body, t);
}
__name(R, "R");
function A(t) {
  return t.split(",").map((e) => {
    let [n, s] = e.split(";"), a = parseFloat((s ?? "q=1").replace(/q *= */gi, ""));
    return [n.trim(), isNaN(a) ? 1 : a];
  }).sort((e, n) => n[1] - e[1]).map(([e]) => e === "*" || e === "" ? [] : e).flat();
}
__name(A, "A");
u();
p();
d();
function O(t) {
  switch (t) {
    case "none":
      return "filesystem";
    case "filesystem":
      return "rewrite";
    case "rewrite":
      return "resource";
    case "resource":
      return "miss";
    default:
      return "miss";
  }
}
__name(O, "O");
async function S(t, { request: e, assetsFetcher: n, ctx: s }, { path: a, searchParams: c }) {
  let i, r = new URL(e.url);
  x(r.searchParams, c);
  let o = new Request(r, e);
  try {
    switch (t?.type) {
      case "function":
      case "middleware": {
        let l = await import(t.entrypoint);
        try {
          i = await l.default(o, s);
        } catch (f) {
          let g = f;
          throw g.name === "TypeError" && g.message.endsWith("default is not a function") ? new Error(`An error occurred while evaluating the target edge function (${t.entrypoint})`) : f;
        }
        break;
      }
      case "override": {
        i = R(await n.fetch(L(o, t.path ?? a))), t.headers && m(i.headers, t.headers);
        break;
      }
      case "static": {
        i = await n.fetch(L(o, a));
        break;
      }
      default:
        i = new Response("Not Found", { status: 404 });
    }
  } catch (l) {
    return console.error(l), new Response("Internal Server Error", { status: 500 });
  }
  return R(i);
}
__name(S, "S");
function B(t, e) {
  let n = "^//?(?:", s = ")/(.*)$";
  return !t.startsWith(n) || !t.endsWith(s) ? false : t.slice(n.length, -s.length).split("|").every((c) => e.has(c));
}
__name(B, "B");
u();
p();
d();
function lt(t, { protocol: e, hostname: n, port: s, pathname: a }) {
  return !(e && t.protocol.replace(/:$/, "") !== e || !new RegExp(n).test(t.hostname) || s && !new RegExp(s).test(t.port) || a && !new RegExp(a).test(t.pathname));
}
__name(lt, "lt");
function ft(t, e) {
  if (t.method !== "GET") return;
  let { origin: n, searchParams: s } = new URL(t.url), a = s.get("url"), c = Number.parseInt(s.get("w") ?? "", 10), i = Number.parseInt(s.get("q") ?? "75", 10);
  if (!a || Number.isNaN(c) || Number.isNaN(i) || !e?.sizes?.includes(c) || i < 0 || i > 100) return;
  let r = new URL(a, n);
  if (r.pathname.endsWith(".svg") && !e?.dangerouslyAllowSVG) return;
  let o = a.startsWith("//"), l = a.startsWith("/") && !o;
  if (!l && !e?.domains?.includes(r.hostname) && !e?.remotePatterns?.find((k) => lt(r, k))) return;
  let f = t.headers.get("Accept") ?? "", g = e?.formats?.find((k) => f.includes(k))?.replace("image/", "");
  return { isRelative: l, imageUrl: r, options: { width: c, quality: i, format: g } };
}
__name(ft, "ft");
function _t(t, e, n) {
  let s = new Headers();
  if (n?.contentSecurityPolicy && s.set("Content-Security-Policy", n.contentSecurityPolicy), n?.contentDispositionType) {
    let c = e.pathname.split("/").pop(), i = c ? `${n.contentDispositionType}; filename="${c}"` : n.contentDispositionType;
    s.set("Content-Disposition", i);
  }
  t.headers.has("Cache-Control") || s.set("Cache-Control", `public, max-age=${n?.minimumCacheTTL ?? 60}`);
  let a = R(t);
  return m(a.headers, s), a;
}
__name(_t, "_t");
async function K(t, { buildOutput: e, assetsFetcher: n, imagesConfig: s }) {
  let a = ft(t, s);
  if (!a) return new Response("Invalid image resizing request", { status: 400 });
  let { isRelative: c, imageUrl: i } = a, o = await (c && i.pathname in e ? n.fetch.bind(n) : fetch)(i);
  return _t(o, i, s);
}
__name(K, "K");
u();
p();
d();
u();
p();
d();
u();
p();
d();
async function C(t) {
  return import(t);
}
__name(C, "C");
var ht = "x-vercel-cache-tags";
var yt = "x-next-cache-soft-tags";
var gt = /* @__PURE__ */ Symbol.for("__cloudflare-request-context__");
async function Z(t) {
  let e = `https://${w}/v1/suspense-cache/`;
  if (!t.url.startsWith(e)) return null;
  try {
    let n = new URL(t.url), s = await mt();
    if (n.pathname === "/v1/suspense-cache/revalidate") {
      let c = n.searchParams.get("tags")?.split(",") ?? [];
      for (let i of c) await s.revalidateTag(i);
      return new Response(null, { status: 200 });
    }
    let a = n.pathname.replace("/v1/suspense-cache/", "");
    if (!a.length) return new Response("Invalid cache key", { status: 400 });
    switch (t.method) {
      case "GET": {
        let c = W(t, yt), i = await s.get(a, { softTags: c });
        return i ? new Response(JSON.stringify(i.value), { status: 200, headers: { "Content-Type": "application/json", "x-vercel-cache-state": "fresh", age: `${(Date.now() - (i.lastModified ?? Date.now())) / 1e3}` } }) : new Response(null, { status: 404 });
      }
      case "POST": {
        let c = globalThis[gt], i = /* @__PURE__ */ __name(async () => {
          let r = await t.json();
          r.data.tags === void 0 && (r.tags ??= W(t, ht) ?? []), await s.set(a, r);
        }, "i");
        return c ? c.ctx.waitUntil(i()) : await i(), new Response(null, { status: 200 });
      }
      default:
        return new Response(null, { status: 405 });
    }
  } catch (n) {
    return console.error(n), new Response("Error handling cache request", { status: 500 });
  }
}
__name(Z, "Z");
async function mt() {
  return process.env.__NEXT_ON_PAGES__KV_SUSPENSE_CACHE ? G("kv") : G("cache-api");
}
__name(mt, "mt");
async function G(t) {
  let e = `./__next-on-pages-dist__/cache/${t}.js`, n = await C(e);
  return new n.default();
}
__name(G, "G");
function W(t, e) {
  return t.headers.get(e)?.split(",")?.filter(Boolean);
}
__name(W, "W");
function Q() {
  globalThis[J] || (xt(), globalThis[J] = true);
}
__name(Q, "Q");
function xt() {
  let t = globalThis.fetch;
  globalThis.fetch = async (...e) => {
    let n = new Request(...e), s = await jt(n);
    return s || (s = await Z(n), s) ? s : (kt(n), t(n));
  };
}
__name(xt, "xt");
async function jt(t) {
  if (t.url.startsWith("blob:")) try {
    let n = `./__next-on-pages-dist__/assets/${new URL(t.url).pathname}.bin`, s = (await C(n)).default, a = { async arrayBuffer() {
      return s;
    }, get body() {
      return new ReadableStream({ start(c) {
        let i = Buffer.from(s);
        c.enqueue(i), c.close();
      } });
    }, async text() {
      return Buffer.from(s).toString();
    }, async json() {
      let c = Buffer.from(s);
      return JSON.stringify(c.toString());
    }, async blob() {
      return new Blob(s);
    } };
    return a.clone = () => ({ ...a }), a;
  } catch {
  }
  return null;
}
__name(jt, "jt");
function kt(t) {
  t.headers.has("user-agent") || t.headers.set("user-agent", "Next.js Middleware");
}
__name(kt, "kt");
var J = /* @__PURE__ */ Symbol.for("next-on-pages fetch patch");
u();
p();
d();
var Y = U(X());
var M = class {
  static {
    __name(this, "M");
  }
  constructor(e, n, s, a, c) {
    this.routes = e;
    this.output = n;
    this.reqCtx = s;
    this.url = new URL(s.request.url), this.cookies = (0, Y.parse)(s.request.headers.get("cookie") || ""), this.path = this.url.pathname || "/", this.headers = { normal: new Headers(), important: new Headers() }, this.searchParams = new URLSearchParams(), x(this.searchParams, this.url.searchParams), this.checkPhaseCounter = 0, this.middlewareInvoked = [], this.wildcardMatch = c?.find((i) => i.domain === this.url.hostname), this.locales = new Set(a.collectedLocales);
  }
  url;
  cookies;
  wildcardMatch;
  path;
  status;
  headers;
  searchParams;
  body;
  checkPhaseCounter;
  middlewareInvoked;
  locales;
  checkRouteMatch(e, { checkStatus: n, checkIntercept: s }) {
    let a = P(e.src, this.path, e.caseSensitive);
    if (!a.match || e.methods && !e.methods.map((i) => i.toUpperCase()).includes(this.reqCtx.request.method.toUpperCase())) return;
    let c = { url: this.url, cookies: this.cookies, headers: this.reqCtx.request.headers, routeDest: e.dest };
    if (!e.has?.find((i) => {
      let r = I(i, c);
      return r.newRouteDest && (c.routeDest = r.newRouteDest), !r.valid;
    }) && !e.missing?.find((i) => I(i, c).valid) && !(n && e.status !== this.status)) {
      if (s && e.dest) {
        let i = /\/(\(\.+\))+/, r = i.test(e.dest), o = i.test(this.path);
        if (r && !o) return;
      }
      return { routeMatch: a, routeDest: c.routeDest };
    }
  }
  processMiddlewareResp(e) {
    let n = "x-middleware-override-headers", s = e.headers.get(n);
    if (s) {
      let o = new Set(s.split(",").map((l) => l.trim()));
      for (let l of o.keys()) {
        let f = `x-middleware-request-${l}`, g = e.headers.get(f);
        this.reqCtx.request.headers.get(l) !== g && (g ? this.reqCtx.request.headers.set(l, g) : this.reqCtx.request.headers.delete(l)), e.headers.delete(f);
      }
      e.headers.delete(n);
    }
    let a = "x-middleware-rewrite", c = e.headers.get(a);
    if (c) {
      let o = new URL(c, this.url), l = this.url.hostname !== o.hostname;
      this.path = l ? `${o}` : o.pathname, x(this.searchParams, o.searchParams), e.headers.delete(a);
    }
    let i = "x-middleware-next";
    e.headers.get(i) ? e.headers.delete(i) : !c && !e.headers.has("location") ? (this.body = e.body, this.status = e.status) : e.headers.has("location") && e.status >= 300 && e.status < 400 && (this.status = e.status), m(this.reqCtx.request.headers, e.headers), m(this.headers.normal, e.headers), this.headers.middlewareLocation = e.headers.get("location");
  }
  async runRouteMiddleware(e) {
    if (!e) return true;
    let n = e && this.output[e];
    if (!n || n.type !== "middleware") return this.status = 500, false;
    let s = await S(n, this.reqCtx, { path: this.path, searchParams: this.searchParams, headers: this.headers, status: this.status });
    return this.middlewareInvoked.push(e), s.status === 500 ? (this.status = s.status, false) : (this.processMiddlewareResp(s), true);
  }
  applyRouteOverrides(e) {
    !e.override || (this.status = void 0, this.headers.normal = new Headers(), this.headers.important = new Headers());
  }
  applyRouteHeaders(e, n, s) {
    !e.headers || (m(this.headers.normal, e.headers, { match: n, captureGroupKeys: s }), e.important && m(this.headers.important, e.headers, { match: n, captureGroupKeys: s }));
  }
  applyRouteStatus(e) {
    !e.status || (this.status = e.status);
  }
  applyRouteDest(e, n, s) {
    if (!e.dest) return this.path;
    let a = this.path, c = e.dest;
    this.wildcardMatch && /\$wildcard/.test(c) && (c = c.replace(/\$wildcard/g, this.wildcardMatch.value)), this.path = b(c, n, s);
    let i = /\/index\.rsc$/i.test(this.path), r = /^\/(?:index)?$/i.test(a), o = /^\/__index\.prefetch\.rsc$/i.test(a);
    i && !r && !o && (this.path = a);
    let l = /\.rsc$/i.test(this.path), f = /\.prefetch\.rsc$/i.test(this.path), g = this.path in this.output;
    l && !f && !g && (this.path = this.path.replace(/\.rsc/i, ""));
    let k = new URL(this.path, this.url);
    return x(this.searchParams, k.searchParams), v(this.path) || (this.path = k.pathname), a;
  }
  applyLocaleRedirects(e) {
    if (!e.locale?.redirect || !/^\^(.)*$/.test(e.src) && e.src !== this.path || this.headers.normal.has("location")) return;
    let { locale: { redirect: s, cookie: a } } = e, c = a && this.cookies[a], i = A(c ?? ""), r = A(this.reqCtx.request.headers.get("accept-language") ?? ""), f = [...i, ...r].map((g) => s[g]).filter(Boolean)[0];
    if (f) {
      !this.path.startsWith(f) && (this.headers.normal.set("location", f), this.status = 307);
      return;
    }
  }
  getLocaleFriendlyRoute(e, n) {
    return !this.locales || n !== "miss" ? e : B(e.src, this.locales) ? { ...e, src: e.src.replace(/\/\(\.\*\)\$$/, "(?:/(.*))?$") } : e;
  }
  async checkRoute(e, n) {
    let s = this.getLocaleFriendlyRoute(n, e), { routeMatch: a, routeDest: c } = this.checkRouteMatch(s, { checkStatus: e === "error", checkIntercept: e === "rewrite" }) ?? {}, i = { ...s, dest: c };
    if (!a?.match || i.middlewarePath && this.middlewareInvoked.includes(i.middlewarePath)) return "skip";
    let { match: r, captureGroupKeys: o } = a;
    if (this.applyRouteOverrides(i), this.applyLocaleRedirects(i), !await this.runRouteMiddleware(i.middlewarePath)) return "error";
    if (this.body !== void 0 || this.headers.middlewareLocation) return "done";
    this.applyRouteHeaders(i, r, o), this.applyRouteStatus(i);
    let f = this.applyRouteDest(i, r, o);
    if (i.check && !v(this.path)) if (f === this.path) {
      if (e !== "miss") return this.checkPhase(O(e));
      this.status = 404;
    } else if (e === "miss") {
      if (!(this.path in this.output) && !(this.path.replace(/\/$/, "") in this.output)) return this.checkPhase("filesystem");
      this.status === 404 && (this.status = void 0);
    } else return this.checkPhase("none");
    return !i.continue || i.status && i.status >= 300 && i.status <= 399 ? "done" : "next";
  }
  async checkPhase(e) {
    if (this.checkPhaseCounter++ >= 50) return console.error(`Routing encountered an infinite loop while checking ${this.url.pathname}`), this.status = 500, "error";
    this.middlewareInvoked = [];
    let n = true;
    for (let c of this.routes[e]) {
      let i = await this.checkRoute(e, c);
      if (i === "error") return "error";
      if (i === "done") {
        n = false;
        break;
      }
    }
    if (e === "hit" || v(this.path) || this.headers.normal.has("location") || !!this.body) return "done";
    if (e === "none") for (let c of this.locales) {
      let i = new RegExp(`/${c}(/.*)`), o = this.path.match(i)?.[1];
      if (o && o in this.output) {
        this.path = o;
        break;
      }
    }
    let s = this.path in this.output;
    if (!s && this.path.endsWith("/")) {
      let c = this.path.replace(/\/$/, "");
      s = c in this.output, s && (this.path = c);
    }
    if (e === "miss" && !s) {
      let c = !this.status || this.status < 400;
      this.status = c ? 404 : this.status;
    }
    let a = "miss";
    return s || e === "miss" || e === "error" ? a = "hit" : n && (a = O(e)), this.checkPhase(a);
  }
  async run(e = "none") {
    this.checkPhaseCounter = 0;
    let n = await this.checkPhase(e);
    return this.headers.normal.has("location") && (!this.status || this.status < 300 || this.status >= 400) && (this.status = 307), n;
  }
};
async function tt(t, e, n, s) {
  let a = new M(e.routes, n, t, s, e.wildcard), c = await et(a);
  return Et(t, c, n);
}
__name(tt, "tt");
async function et(t, e = "none", n = false) {
  return await t.run(e) === "error" || !n && t.status && t.status >= 400 ? et(t, "error", true) : { path: t.path, status: t.status, headers: t.headers, searchParams: t.searchParams, body: t.body };
}
__name(et, "et");
async function Et(t, { path: e = "/404", status: n, headers: s, searchParams: a, body: c }, i) {
  let r = s.normal.get("location");
  if (r) {
    if (r !== s.middlewareLocation) {
      let f = [...a.keys()].length ? `?${a.toString()}` : "";
      s.normal.set("location", `${r ?? "/"}${f}`);
    }
    return new Response(null, { status: n, headers: s.normal });
  }
  let o;
  if (c !== void 0) o = new Response(c, { status: n });
  else if (v(e)) {
    let f = new URL(e);
    x(f.searchParams, a), o = await fetch(f, t.request);
  } else o = await S(i[e], t, { path: e, status: n, headers: s, searchParams: a });
  let l = s.normal;
  return m(l, o.headers), m(l, s.important), o = new Response(o.body, { ...o, status: n || o.status, headers: l }), o;
}
__name(Et, "Et");
u();
p();
d();
function st() {
  globalThis.__nextOnPagesRoutesIsolation ??= { _map: /* @__PURE__ */ new Map(), getProxyFor: Mt };
}
__name(st, "st");
function Mt(t) {
  let e = globalThis.__nextOnPagesRoutesIsolation._map.get(t);
  if (e) return e;
  let n = Tt();
  return globalThis.__nextOnPagesRoutesIsolation._map.set(t, n), n;
}
__name(Mt, "Mt");
function Tt() {
  let t = /* @__PURE__ */ new Map();
  return new Proxy(globalThis, { get: /* @__PURE__ */ __name((e, n) => t.has(n) ? t.get(n) : Reflect.get(globalThis, n), "get"), set: /* @__PURE__ */ __name((e, n, s) => qt.has(n) ? Reflect.set(globalThis, n, s) : (t.set(n, s), true), "set") });
}
__name(Tt, "Tt");
var qt = /* @__PURE__ */ new Set(["_nextOriginalFetch", "fetch", "__incrementalCache"]);
var It = Object.defineProperty;
var Lt = /* @__PURE__ */ __name((...t) => {
  let e = t[0], n = t[1], s = "__import_unsupported";
  if (!(n === s && typeof e == "object" && e !== null && s in e)) return It(...t);
}, "Lt");
globalThis.Object.defineProperty = Lt;
globalThis.AbortController = class extends AbortController {
  constructor() {
    try {
      super();
    } catch (e) {
      if (e instanceof Error && e.message.includes("Disallowed operation called within global scope")) return { signal: { aborted: false, reason: null, onabort: /* @__PURE__ */ __name(() => {
      }, "onabort"), throwIfAborted: /* @__PURE__ */ __name(() => {
      }, "throwIfAborted") }, abort() {
      } };
      throw e;
    }
  }
};
var Rs = { async fetch(t, e, n) {
  st(), Q();
  let s = await __ALSes_PROMISE__;
  if (!s) {
    let i = new URL(t.url), r = await e.ASSETS.fetch(`${i.protocol}//${i.host}/cdn-cgi/errors/no-nodejs_compat.html`), o = r.ok ? r.body : "Error: Could not access built-in Node.js modules. Please make sure that your Cloudflare Pages project has the 'nodejs_compat' compatibility flag set.";
    return new Response(o, { status: 503 });
  }
  let { envAsyncLocalStorage: a, requestContextAsyncLocalStorage: c } = s;
  return a.run({ ...e, NODE_ENV: "production", SUSPENSE_CACHE_URL: w }, async () => c.run({ env: e, ctx: n, cf: t.cf }, async () => {
    if (new URL(t.url).pathname.startsWith("/_next/image")) return K(t, { buildOutput: h, assetsFetcher: e.ASSETS, imagesConfig: _.images });
    let r = D(t);
    return tt({ request: r, ctx: n, assetsFetcher: e.ASSETS }, _, h, y);
  }));
} };
export {
  Rs as default
};
/*!
 * cookie
 * Copyright(c) 2012-2014 Roman Shtylman
 * Copyright(c) 2015 Douglas Christopher Wilson
 * MIT Licensed
 */
//# sourceMappingURL=bundledWorker-0.02026888032177221.mjs.map
