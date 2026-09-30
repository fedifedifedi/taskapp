import {
  createTaskSchema,
  listTasksQuerySchema,
  taskIdParamsSchema,
  updateTaskSchema,
} from '@taskapp/shared';
import type { Request, Response } from 'express';
import { getAuthUser } from '../../middlewares/require-auth.js';
import type { TaskService } from './task.service.js';

export function createTaskController(taskService: TaskService) {
  return {
    async list(req: Request, res: Response) {
      const query = listTasksQuerySchema.parse(req.query);
      res.status(200).json(await taskService.list(getAuthUser(req).id, query));
    },

    async getById(req: Request, res: Response) {
      const { id } = taskIdParamsSchema.parse(req.params);
      res.status(200).json({ data: await taskService.getById(getAuthUser(req).id, id) });
    },

    async create(req: Request, res: Response) {
      const input = createTaskSchema.parse(req.body);
      res.status(201).json({ data: await taskService.create(getAuthUser(req).id, input) });
    },

    async update(req: Request, res: Response) {
      const { id } = taskIdParamsSchema.parse(req.params);
      const input = updateTaskSchema.parse(req.body);
      res.status(200).json({ data: await taskService.update(getAuthUser(req).id, id, input) });
    },

    async complete(req: Request, res: Response) {
      const { id } = taskIdParamsSchema.parse(req.params);
      res.status(200).json({ data: await taskService.complete(getAuthUser(req).id, id) });
    },

    async remove(req: Request, res: Response) {
      const { id } = taskIdParamsSchema.parse(req.params);
      await taskService.remove(getAuthUser(req).id, id);
      res.status(204).end();
    },
  };
}

export type TaskController = ReturnType<typeof createTaskController>;
