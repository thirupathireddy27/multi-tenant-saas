const applyTenantFilter = (query, tenantId, isSuperAdmin = false) => {
  if (isSuperAdmin) return query;
  return `${query} WHERE tenant_id = '${tenantId}'`;
};

module.exports = applyTenantFilter;
