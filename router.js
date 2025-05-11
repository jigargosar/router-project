class Router {
  constructor() {
    this.routes = [];
  }

  // Register a route with dynamic parameters and a handler
  registerRoute(method, path, handler) {
    // Remove leading/trailing slashes and split into segments
    const segments = path.replace(/^\/|\/$/g, '').split('/');
    const dynamicParams = [];
    const regexSegments = segments.map(segment => {
      // Check for dynamic segments in the form :param(type)
      if (segment.startsWith(':')) {
        const match = segment.match(/^:(\w+)\((int|string)\)$/);
        if (match) {
          const paramName = match[1];
          const paramType = match[2];
          dynamicParams.push(paramName);
          // Use \d+ for int and a basic pattern for string
          const pattern = paramType === 'int' ? '\\d+' : '[a-zA-Z0-9_-]+';
          return `(${pattern})`;
        } else {
          throw new Error(`Invalid route segment: ${segment}`);
        }
      } else {
        // Escape special regex characters in static segments
        return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      }
    });

    // Build the regex pattern ensuring an exact match with start (^) and end ($)
    const regexPattern = new RegExp(`^/${regexSegments.join('/')}$`);
    this.routes.push({
      method,
      regex: regexPattern,
      dynamicParams,
      handler
    });
  }

  // Match the first valid route and call its handler with extracted parameters
  handleRequest(method, urlPath) {
    for (const route of this.routes) {
      if (route.method !== method) continue;
      const match = urlPath.match(route.regex);
      if (match) {
        const params = {};
        // match[0] is the full match; capturing groups start at index 1
        route.dynamicParams.forEach((paramName, index) => {
          params[paramName] = match[index + 1];
        });
        return route.handler(params);
      }
    }
    return "404 Not Found";
  }
}

module.exports = Router;
