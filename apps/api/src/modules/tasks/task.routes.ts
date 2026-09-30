import { Router } from 'express';
import { requireAuth } from '../../middlewares/require-auth.js';
import type { TaskController } from './task.controller.js';

export function createTaskRouter(controller: TaskController): Router {
  const router = Router();

  router.use(requireAuth);

  router.get('/', controller.list);
  router.post('/', controller.create);
  router.get('/:id', controller.getById);
  router.patch('/:id', controller.update);
  router.patch('/:id/complete', controller.complete);
  router.delete('/:id', controller.remove);

  return router;
}
