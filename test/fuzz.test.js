const fc = require("fast-check");
const Router = require("../router");

describe("Router Fuzz Tests", () => {
    let router;
    beforeEach(() => {
        // Create a new router and register routes before each test run.
        router = new Router();
        router.registerRoute("GET", "/user/:id(int)", params => `User ${params.id}`);
        router.registerRoute("POST", "/post/:slug(string)", params => `Post ${params.slug}`);
        router.registerRoute("GET", "/category/:name(string)/:page(int)", params => `Category ${params.name}, Page ${params.page}`);
    });

    // General test: no unexpected exception for arbitrary HTTP methods/paths.
    it("should not throw for arbitrary HTTP methods and URL paths", () => {
        fc.assert(
            fc.property(
                fc.constantFrom("GET", "POST", "PUT", "DELETE", "PATCH"),
                fc.string(),
                (method, urlPath) => {
                    let result;
                    try {
                        result = router.handleRequest(method, urlPath);
                    } catch (e) {
                        return false;
                    }
                    return typeof result === "string";
                }
            ),
            { numRuns: 1000 }
        );
    });

    // Test for extra or random slashes.
    it("should handle URL paths with extra or random slashes gracefully", () => {
        fc.assert(
            fc.property(
                // Generate an array of chosen characters then join into a string.
                fc.array(fc.constantFrom("a", "b", "c", "1", "2", "/", "-")).map(arr => arr.join("")),
                (randomPath) => {
                    // Ensure the path starts with a slash.
                    const formattedPath = "/" + randomPath;
                    try {
                        const result = router.handleRequest("GET", formattedPath);
                        return typeof result === "string";
                    } catch (e) {
                        return false;
                    }
                }
            ),
            { numRuns: 1000 }
        );
    });

    // Fuzz test for dynamic route /user/:id(int) with valid numeric input.
    it("should correctly match dynamic route /user/:id(int) with valid numeric id", () => {
        fc.assert(
            fc.property(
                // Generate integers to use as id.
                fc.integer({ min: 0, max: 1000000 }),
                (num) => {
                    const idStr = num.toString();
                    const url = `/user/${idStr}`;
                    const result = router.handleRequest("GET", url);
                    return result === `User ${idStr}`;
                }
            ),
            { numRuns: 500 }
        );
    });

    // Fuzz test for dynamic route /user/:id(int) with non-numeric id.
    it("should return 404 for /user/:id(int) with non-numeric id", () => {
        fc.assert(
            fc.property(
                // Generate an alphabetic string (avoid numeric-only).
                fc.stringOf(fc.constantFrom("a", "b", "c", "d", "e"), { minLength: 1 }),
                (str) => {
                    // If the generated string is numeric, skip.
                    if (/^\d+$/.test(str)) return true;
                    const url = `/user/${str}`;
                    const result = router.handleRequest("GET", url);
                    return result === "404 Not Found";
                }
            ),
            { numRuns: 500 }
        );
    });

    // Fuzz test for dynamic route /post/:slug(string) with valid slug characters.
    it("should correctly match dynamic route /post/:slug(string) with valid slug", () => {
        fc.assert(
            fc.property(
                fc.array(fc.constantFrom("a", "b", "c", "1", "2", "_", "-"))
                    .map(arr => arr.join(""))
                    .filter(slug => slug.length > 0), // non-empty slug
                (slug) => {
                    const url = `/post/${slug}`;
                    const result = router.handleRequest("POST", url);
                    return result === `Post ${slug}`;
                }
            ),
            { numRuns: 500 }
        );
    });

    // Fuzz test for dynamic route /post/:slug(string) with invalid slug characters.
    it("should return 404 for /post/:slug(string) if slug contains invalid characters", () => {
        fc.assert(
            fc.property(
                // Generate strings that include characters outside the allowed set.
                fc.string().filter(slug => slug.length > 0 && /[^a-zA-Z0-9_-]/.test(slug)),
                (slug) => {
                    const url = `/post/${slug}`;
                    const result = router.handleRequest("POST", url);
                    return result === "404 Not Found";
                }
            ),
            { numRuns: 500 }
        );
    });

    // Fuzz test for dynamic route /category/:name(string)/:page(int) with valid parameters.
    it("should correctly match dynamic route /category/:name(string)/:page(int) with valid params", () => {
        fc.assert(
            fc.property(
                // Generate a valid name: a non-empty string from allowed characters.
                fc.array(fc.constantFrom("a", "b", "c", "d", "e")).map(arr => arr.join("")).filter(name => name.length > 0),
                // Generate an integer for the page.
                fc.integer({ min: 0, max: 1000 }),
                (name, page) => {
                    const pageStr = page.toString();
                    const url = `/category/${name}/${pageStr}`;
                    const result = router.handleRequest("GET", url);
                    return result === `Category ${name}, Page ${pageStr}`;
                }
            ),
            { numRuns: 500 }
        );
    });

    // Fuzz test for dynamic route /category/:name(string)/:page(int) with invalid cases.
    it("should return 404 for /category/:name(string)/:page(int) if any parameter is invalid", () => {
        fc.assert(
            fc.property(
                // For the name part, generate strings that contain at least one invalid character.
                fc.string().filter(s => s.length > 0 && /[^a-zA-Z0-9_-]/.test(s)),
                // For the page part, generate strings that do not represent a valid integer.
                fc.string().filter(s => s.length > 0 && /[^0-9]/.test(s)),
                (invalidName, invalidPage) => {
                    // Test when the name is invalid.
                    const url1 = `/category/${invalidName}/123`;
                    const result1 = router.handleRequest("GET", url1);
                    // Test when the page is invalid.
                    const url2 = `/category/goodname/${invalidPage}`;
                    const result2 = router.handleRequest("GET", url2);
                    return result1 === "404 Not Found" && result2 === "404 Not Found";
                }
            ),
            { numRuns: 500 }
        );
    });
});
