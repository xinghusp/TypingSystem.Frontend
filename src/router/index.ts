import { createRouter, createWebHistory } from "vue-router";
import TaskList from "../views/TaskList.vue";
import TaskExecution from "../views/TaskExec.vue";
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/task/list",
      name: "tasklist",
      component: TaskList,
    },
    {
      path: "/task/:type/:id",
      name: "TaskExecution",
      component: TaskExecution,
      props: (route) => ({
        taskId: Number(route.params.id),
        taskType: route.params.type,
        examCode: route.query.code || "",
      }),
      //meta: { requiresAuth: true },
    },
  ],
});

export default router;
