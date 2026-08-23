import { db } from './db.js';

const insert = db.prepare(`
  INSERT INTO audit_log (user_id, actor_email, action, entity, entity_id, before_json, after_json)
  VALUES (@user_id, @actor_email, @action, @entity, @entity_id, @before_json, @after_json)
`);

export const audit = (req, action, entity, entityId, before, after) => {
  insert.run({
    user_id: req.user?.id ?? null,
    actor_email: req.user?.email ?? 'system',
    action,
    entity,
    entity_id: entityId != null ? String(entityId) : null,
    before_json: before ? JSON.stringify(before) : null,
    after_json: after ? JSON.stringify(after) : null,
  });
};
