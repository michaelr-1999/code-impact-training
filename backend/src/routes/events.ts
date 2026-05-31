import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { createEventController, updateEventController, deleteEventController, getEventsController, deleteEventSeriesController } from "../controllers/eventController";

const router = Router();

router.use(requireAuth);
router.get("/", getEventsController);
router.post("/", createEventController);
router.put("/:id", updateEventController);
router.delete("/series/:seriesId", deleteEventSeriesController);
router.delete("/:id", deleteEventController);

export default router;
