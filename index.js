export default {
  async fetch(request, env, ctx) {
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/').filter(segment => segment);
    if (pathSegments[0] !== 'webhook' || pathSegments.length !== 2) {
      return new Response('Invalid webhook URL. Use /webhook/<unique_name>', { status: 400 });
    }
    const uniqueName = pathSegments[1];
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const minutes = String(now.getUTCMinutes()).padStart(2, '0');
    const seconds = String(now.getUTCSeconds()).padStart(2, '0');
    const folderPath = `${year}/${month}/${day}`;
    const timestamp = `${hours}${minutes}${seconds}`;
    const fileName = `${uniqueName}-${timestamp}.json`;
    const objectKey = `${folderPath}/${fileName}`;
    try {
      const apiData = await request.json();
      await env.MY_R2_BUCKET.put(objectKey, JSON.stringify(apiData, null, 2), {
        httpMetadata: { contentType: 'application/json' },
      });
      return new Response(JSON.stringify({
        message: 'Data stored successfully',
        objectKey: objectKey,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: 'Failed to process webhook',
        details: error.message,
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};
