const assert = require("assert");
const Router = require("../router");

describe("Router Hardcoded Tests", () => {
    let router;

    beforeEach(() => {
        router = new Router();
        router.registerRoute("GET", "/user/:id(int)", params => `User ${params.id}`);
        router.registerRoute("POST", "/post/:slug(string)", params => `Post ${params.slug}`);
        router.registerRoute("GET", "/category/:name(string)/:page(int)", params => `Category ${params.name}, Page ${params.page}`);
    });

    it("should match GET /user/:id and extract id", () => {
        const result = router.handleRequest("GET", "/user/42");
        assert.strictEqual(result, "User 42");
    });

    it("should not match if parameter pattern is invalid", () => {
        const result = router.handleRequest("GET", "/user/abc");
        assert.strictEqual(result, "404 Not Found");
    });

    it("should allow only the correct HTTP method", () => {
        const result = router.handleRequest("POST", "/user/42");
        assert.strictEqual(result, "404 Not Found");
    });

    it("should match POST /post/:slug", () => {
        const result = router.handleRequest("POST", "/post/hello-world");
        assert.strictEqual(result, "Post hello-world");
    });

    it("should match a route with multiple dynamic segments", () => {
        const result = router.handleRequest("GET", "/category/science/2");
        assert.strictEqual(result, "Category science, Page 2");
    });

    it("should return 404 for non-existent routes", () => {
        const result = router.handleRequest("GET", "/nonexistent/path");
        assert.strictEqual(result, "404 Not Found");
    });
});
