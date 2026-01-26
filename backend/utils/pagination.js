/**
 * Pagination helper for Sequelize queries
 * @param {Object} query - Request query parameters
 * @returns {Object} - Pagination options for Sequelize
 */
function getPaginationParams(query) {
  const page = parseInt(query.page) || 1;
  const limit = Math.min(parseInt(query.limit) || 10, 100); // Max 100 items per page
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Format pagination response
 * @param {Array} data - Query results
 * @param {Number} total - Total count
 * @param {Number} page - Current page
 * @param {Number} limit - Items per page
 * @returns {Object} - Formatted pagination response
 */
function formatPaginationResponse(data, total, page, limit) {
  const totalPages = Math.ceil(total / limit);
  
  return {
    success: true,
    data,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
}

/**
 * Build query filters from request
 * @param {Object} query - Request query parameters
 * @param {Array} allowedFilters - Allowed filter fields
 * @returns {Object} - Sequelize where clause
 */
function buildFilters(query, allowedFilters = []) {
  const filters = {};
  
  allowedFilters.forEach(field => {
    if (query[field] !== undefined && query[field] !== '') {
      filters[field] = query[field];
    }
  });

  return filters;
}

/**
 * Build sorting options from request
 * @param {Object} query - Request query parameters
 * @param {String} defaultSort - Default sort field
 * @returns {Array} - Sequelize order clause
 */
function buildSort(query, defaultSort = 'createdAt') {
  const sortBy = query.sortBy || defaultSort;
  const sortOrder = query.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  
  return [[sortBy, sortOrder]];
}

module.exports = {
  getPaginationParams,
  formatPaginationResponse,
  buildFilters,
  buildSort
};
