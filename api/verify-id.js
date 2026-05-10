const crypto = require('crypto');

module.exports = async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { game, playerId, serverId } = req.body;

  if (!game || !playerId) {
    return res.status(400).json({ error: 'game and playerId are required' });
  }

  try {
    // ─── FREE FIRE (Public API) ───
    if (game === 'freefire') {
      const apiUrl = `https://free-ff-api-src-5plp.onrender.com/api/v1/account?region=ID&uid=${playerId}`;
      const response = await fetch(apiUrl);
      if (!response.ok) return res.status(404).json({ success: false, message: "Free Fire ID not found" });
      
      const data = await response.json();
      if (data && data.basicInfo && data.basicInfo.nickname) {
        return res.status(200).json({
          success: true,
          name: data.basicInfo.nickname,
          game: "Free Fire",
          id: playerId
        });
      }
      return res.status(404).json({ success: false, message: "Free Fire ID not found" });
    }

    // ─── MOBILE LEGENDS ───
    if (game === 'mobilelegends') {
      if (!serverId) return res.status(400).json({ error: 'serverId is required for Mobile Legends' });
      const apiUrl = `https://api.isan.eu.org/nickname/ml?id=${playerId}&server=${serverId}`;
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.success && data.name) {
        return res.status(200).json({ success: true, name: data.name, game: "Mobile Legends", id: playerId });
      }
      return res.status(404).json({ success: false, message: "ML Player not found" });
    }

    // ─── BLOOD STRIKE (RapidAPI) ───
    if (game === 'bloodstrike') {
      const apiKey = process.env.RAPIDAPI_KEY;
      if (!apiKey) return res.status(500).json({ error: 'RAPIDAPI_KEY not configured on server' });

      const apiUrl = `https://id-game-checker.p.rapidapi.com/blood-strike/${playerId}`;
      const response = await fetch(apiUrl, {
        headers: {
          "x-rapidapi-host": "id-game-checker.p.rapidapi.com",
          "x-rapidapi-key": apiKey
        }
      });
      const data = await response.json();

      if (data && (data.username || (data.data && data.data.username))) {
        return res.status(200).json({
          success: true,
          name: data.username || data.data.username,
          game: "Blood Strike",
          id: playerId
        });
      }
      return res.status(404).json({ success: false, message: "Blood Strike ID not found" });
    }

    return res.status(400).json({ error: 'Unsupported game' });
  } catch (error) {
    console.error('❌ verify-id error:', error.message);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
