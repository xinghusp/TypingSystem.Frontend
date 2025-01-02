<template>
    <div class="task-list">
        <el-tabs v-model="activeTab" type="card" style="width: 90%;margin: 20px auto;">
            <el-tab-pane label="练习任务" name="practice">
                <el-table :data="practiceTasks" stripe style="width: 100%">
                    <el-table-column prop="title" label="任务标题" />
                    <el-table-column label="任务状态">
                        <template #default="{ row }">
                            <el-tag :type="getStatusTagType(row.status)" effect="dark">
                                {{ row.status }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="maxAttempts" label="最大尝试次数" />
                    <el-table-column prop="timeLimit" label="时间限制" />
                    <el-table-column label="操作">
                        <template #default="{ row }">
                            <el-button type="primary" size="small" @click="startTask(row.id, 'practice')">
                                开始
                            </el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </el-tab-pane>
            <el-tab-pane label="测试任务" name="exam">
                <el-table :data="examTasks" stripe style="width: 100%">
                    <el-table-column prop="title" label="任务标题" />
                    <el-table-column label="任务状态">
                        <template #default="{ row }">
                            <el-tag :type="getStatusTagType(row.status)" effect="dark">
                                {{ row.status }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="dateRange" label="有效时间" />
                    <el-table-column prop="timeLimit" label="时间限制" />
                    <el-table-column label="操作">
                        <template #default="{ row }">
                            <el-button type="primary" size="small" @click="enterExam(row.id)">
                                开始
                            </el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </el-tab-pane>
        </el-tabs>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { getPracticeTasks, getExamTasks } from '@/services/taskService';

export default defineComponent({
    name: 'TaskList',
    setup() {
        const activeTab = ref('practice');
        const practiceTasks = ref([]);
        const examTasks = ref([]);

        // 加载任务数据
        const loadTasks = async () => {
            practiceTasks.value = await getPracticeTasks();
            examTasks.value = await getExamTasks();
        };

        // 获取状态标签类型
        const getStatusTagType = (status: string) => {
            switch (status) {
                case '进行中':
                    return 'success'; // 绿色
                case '未开始':
                    return 'info'; // 蓝色
                case '已完成':
                    return 'warning'; // 黄色
                case '已过期':
                    return 'danger'; // 红色
                default:
                    return ''; // 默认无颜色
            }
        };

        const startTask = (taskId: number, type: string) => {
            if (type === 'practice') {
                window.open(`/task/practice/${taskId}`, '_blank');
            }
        };

        const enterExam = (taskId: number) => {
            const examCode = prompt('请输入考试码');
            if (!examCode) return;
            // 调用 API 验证考试码
            // 验证通过后进入任务页面
            window.open(`/task/exam/${taskId}?code=${examCode}`, '_blank');
        };

        onMounted(() => {
            loadTasks();
        });

        return {
            activeTab,
            practiceTasks,
            examTasks,
            startTask,
            enterExam,
            getStatusTagType,
        };
    },
});
</script>
