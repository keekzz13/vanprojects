const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': 'https://vanprojects.netlify.app',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod === 'POST') {
    try {
      const { payload } = JSON.parse(event.body);
      if (!payload) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Payload is required' }),
        };
      }
      const { error } = await supabase.from('embeds').insert([{ payload }]);
      if (error) throw error;
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ message: 'Embed saved' }),
      };
    } catch (error) {
      console.error('Error saving embed:', error.message);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to save embed' }),
      };
    }
  }

  if (event.httpMethod === 'GET') {
    try {
      const { data, error } = await supabase
        .from('embeds')
        .select('id, payload, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data),
      };
    } catch (error) {
      console.error('Error fetching embeds:', error.message);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to fetch embeds' }),
      };
    }
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: 'Method not allowed' }),
  };
};
