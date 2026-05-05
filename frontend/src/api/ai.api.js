import aiClient from "./aiClient";

export const aiApi = {
  /**
   * Semantic search — finds products by meaning not keywords
   * @param {string} query - natural language search query
   * @param {number} topK - number of results to return
   */
  search: (query, topK = 5) =>
    aiClient.post("/search/", { query, top_k: topK }),

  /**
   * RAG Chatbot — answers fashion questions using product catalog
   * @param {string} message - user's chat message
   */
  chat: (message) =>
    aiClient.post("/chat/", { message }),

  /**
   * Similar products — "You may also like" for product detail page
   * @param {string} productId - UUID of the product being viewed
   * @param {number} topK - number of similar products to return
   */
  getSimilarProducts: (productId, topK = 4) =>
    aiClient.get(`/recommendations/${productId}`, { params: { top_k: topK } }),

  /**
   * Outfit Generator — builds complete outfit for an occasion within budget
   * @param {string} occasion - e.g. "formal office meeting"
   * @param {number} budget - total budget in Rs.
   */
  generateOutfit: (occasion, budget) =>
    aiClient.post("/outfit/", { occasion, budget }),
};