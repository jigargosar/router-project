const fc = require("fast-check");
const Router = require("../router");

describe("Router Fuzz Tests", () => {
    let router;

    beforeEach(() => {
        // Set up the router with routes before each test
        router = new Router();
        router.registerRoute("GET", "/user/:id(int)", params => `User ${params.id}`);
        router.registerRoute("POST", "/post/:slug(string)", params => `Post ${params.slug}`);
        router.registerRoute("GET", "/category/:name(string)/:page(int)", params => `Category ${params.name}, Page ${params.page}`);
    });

    it("should not throw when handling arbitrary HTTP methods and URL paths", () => {
        fc.assert(
            fc.property(
                // Generate a random HTTP method (includes some not registered)
                fc.constantFrom("GET", "POST", "PUT", "DELETE", "PATCH"),
                // Generate arbitrary strings as URL paths
                fc.string(),
                (method, urlPath) => {
                    let result;
                    try {
                        result = router.handleRequest(method, urlPath);
                    } catch (e) {
                        // Fail the property if an exception is thrown
                        return false;
                    }
                    // Ensure that the output is always a string.
                    return typeof result === "string";
                }
            ),
            { numRuns: 1000 }
        );
    });

    it("should handle URL paths with extra or random slashes gracefully", () => {
        fc.assert(
            fc.property(
                // Generate an array of chosen characters then join them into a string
                fc.array(fc.constantFrom("a", "b", "c", "1", "2", "/", "-")).map(arr => arr.join("")),
                (randomPath) => {
                    // Ensure the path starts with a slash
                    const formattedPath = "/" + randomPath;
                    try {
                        const result = router.handleRequest("GET", formattedPath);
                        // We only care that a string is returned
                        return typeof result === "string";
                    } catch (e) {
                        return false;
                    }
                }
            ),
            { numRuns: 1000 }
        );
    });
});
