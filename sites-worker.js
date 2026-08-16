export default {
  async fetch(request, env) {
    const accept = request.headers.get('accept') ?? '';
    if (request.method === 'GET' && accept.includes('text/html')) {
      const url = new URL(request.url);
      url.pathname = '/';
      return env.ASSETS.fetch(new Request(url, request));
    }

    return env.ASSETS.fetch(request);
  },
};
