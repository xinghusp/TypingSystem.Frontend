<template>
    <p class="centered-title">
        我是标题
    </p>
    <div class="task-execution">
        <el-affix>
            <div class="task-header">
                <el-row>
                    <el-col :span="6">
                        <span> <el-icon>
                                <Aim />
                            </el-icon> 打字速度: {{ typingSpeed }} 键/分钟</span>
                    </el-col>
                    <el-col :span="6">
                        <span><el-icon>
                                <Clock />
                            </el-icon> 已用时长: {{ formatTime(elapsedTime) }}</span>
                    </el-col>
                    <el-col :span="6">
                        <span><el-icon>
                                <Warning />
                            </el-icon> 剩余时长:
                            <span v-if="timeRemaining === -1">不限时</span>
                            <span v-else>{{ formatTime(timeRemaining) }}</span>
                        </span>
                    </el-col>
                    <el-col :span="6">
                        <el-progress :percentage="progress" :status="progressStatus" :text-inside="true"
                            :stroke-width="24" />
                    </el-col>
                </el-row>
            </div>
        </el-affix>
        <div class="task-content">
            <div>
                <!-- <h3>任务内容</h3> -->
                <div v-for="(line, index) in formattedParagraphs" :key="index">
                    <!-- 原文行 -->
                    <p class="original-text">
                        <span v-for="(char, charIndex) in line" :key="charIndex"
                            :class="getCharClass(index, charIndex)">
                            {{ char }}
                        </span>
                    </p>
                    <!-- 文本框 -->
                    <input ref="inputs" v-model="userInput[index]" type="text" @input="onInputChange(index)"
                        @keydown.backspace="onBackspace(index)" :disabled="isTaskCompleted" @focus="currentLine = index"
                        class="text-input" />

                </div>
            </div>
        </div>
    </div>
</template>
<script lang="ts">
import { defineComponent, ref, onMounted, reactive, watch, nextTick, onBeforeUnmount, computed } from "vue";
import axios from 'axios';

export default defineComponent({
    name: "TaskExecution",
    props: {
        taskId: {
            type: Number,
            required: true,
        },
        taskType: {
            type: String,
            required: true, // 'practice' 或 'exam'
        },
        examCode: {
            type: String,
            required: false, // 测试任务需要
        },
    },
    setup(props) {
        const article = ref<string>("");
        const lines = ref<string[]>([]); // 文章的分行内容
        const userInput = reactive<string[]>([]); // 用户输入内容，每行对应一个字符串
        const charStatus = reactive<{ [key: number]: { [key: number]: string } }>({}); // 字符状态 'correct' | 'error' | 'neutral'
        const typingSpeed = ref(0); // 当前打字速度（键/分钟）
        const elapsedTime = ref(0); // 已用时长（秒）
        const timeRemaining = ref(-1); // 剩余时长（秒），-1 表示不限时
        const progress = ref(0); // 任务进度百分比
        const currentLine = ref(0); // 当前输入行
        const isTaskCompleted = ref(false); // 任务是否完成
        let timer: any; // 定时器句柄
        const inputs = ref<HTMLInputElement[]>([]); // 输入框引用

        // 加载任务内容
        const loadTask = async () => {
            try {
                const response = await axios.get(`http://rap2api.taobao.org/app/mock/321665/api/tasks/1`);
                const data = response.data;
                article.value = response.data;
                const containerWidth = document.querySelector(".task-content").clientWidth;
                const font = '18px Microsoft YaHei';

                lines.value = splitTextToLines(article.value, containerWidth, font);;
                // 初始化用户输入和字符状态
                userInput.splice(0, userInput.length, ...Array(lines.value.length).fill(''));
                lines.value.forEach((line, lineIndex) => {
                    charStatus[lineIndex] = {};
                    for (let i = 0; i < line.length; i++) {
                        charStatus[lineIndex][i] = 'neutral';
                    }
                });
                // 设置时间限制
                if (props.taskType === 'practice') {
                    timeRemaining.value = data.timeLimit === null ? -1 : data.timeLimit;
                } else if (props.taskType === 'exam') {
                    timeRemaining.value = data.timeLimit; // 测试任务不允许不限时
                }
                await nextTick();
                // 自动聚焦到第一行输入框
                if (inputs.value[0]) {
                    inputs.value[0].focus();
                    currentLine.value = 0;
                }
            } catch (error) {
                console.error("加载任务失败:", error);
            }
        };

        // 格式化时间显示
        const formatTime = (seconds: number) => {
            if (seconds < 0 || seconds === undefined) {
                return '无';
            }
            //console.log(seconds);
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins}分 ${secs}秒`;
        };

        // 获取字符的CSS类
        const getCharClass = (lineIndex: number, charIndex: number) => {
            if (!charStatus[lineIndex]) return '';
            return {
                'correct-char': charStatus[lineIndex][charIndex] === 'correct',
                'error-char': charStatus[lineIndex][charIndex] === 'error',
                'neutral-char': charStatus[lineIndex][charIndex] === 'neutral',
            };
        };

        // 处理用户输入变化
        const onInputChange = (lineIndex: number) => {
            const input = userInput[lineIndex];
            const originalLine = lines.value[lineIndex];
            for (let i = 0; i < originalLine.length; i++) {
                const userChar = input[i];
                if (userChar === undefined) {
                    charStatus[lineIndex][i] = 'neutral';
                } else if (userChar === originalLine[i]) {
                    charStatus[lineIndex][i] = 'correct';
                } else {
                    charStatus[lineIndex][i] = 'error';
                }
            }
            // 自动跳转到下一行
            if (input.length === originalLine.length && lineIndex < lines.value.length - 1) {
                nextTick(() => {
                    const next = inputs.value[lineIndex + 1];
                    if (next) {
                        next.focus();
                        currentLine.value = lineIndex + 1;
                    }
                });
            }

        };

        // 处理回退键
        const onBackspace = (lineIndex: number) => {
            const input = userInput[lineIndex];
            if (input.length === 0 && lineIndex > 0) {
                nextTick(() => {
                    const prev = inputs.value[lineIndex - 1];
                    if (prev) {
                        prev.focus();
                        currentLine.value = lineIndex - 1;
                    }
                });
            }
        };

        // 更新打字速度和进度
        const updateProgress = () => {
            let totalChars = 0;
            let correctChars = 0;
            lines.value.forEach((line, lineIndex) => {
                totalChars += line.length;
                userInput[lineIndex].split('').forEach((char, charIndex) => {
                    if (char === line[charIndex]) {
                        correctChars += 1;
                    }
                });
            });
            progress.value = totalChars === 0 ? 0 : Math.floor((correctChars / totalChars) * 100);
            typingSpeed.value = elapsedTime.value > 0 ? Math.floor((correctChars / elapsedTime.value) * 60) : 0;
            // console.log(correctChars, totalChars, progress.value);
            // 检查任务是否完成
            if (correctChars === totalChars) {
                completeTask();
            }
        };

        // 任务完成处理
        const completeTask = () => {
            isTaskCompleted.value = true;
            clearInterval(timer);
            submitResult();
            alert('恭喜完成任务！');
        };

        // 提交结果
        const submitResult = async () => {
            try {
                const payload = {
                    taskId: props.taskId,
                    typingSpeed: typingSpeed.value,
                    elapsedTime: elapsedTime.value,
                    signature: ''
                };
                // 签名校验逻辑（示例，具体实现需与后端协商）
                payload['signature'] = generateSignature(payload);
                await axios.post('/api/tasks/submit', payload);
            } catch (error) {
                console.error("提交结果失败:", error);
            }
        };

        // 生成签名（示例函数，需根据实际情况实现）
        const generateSignature = (payload: any) => {
            // 使用 HMAC 或其他加密方式生成签名
            return "example-signature";
        };

        // 倒计时逻辑
        const startTimer = () => {
            timer = setInterval(() => {
                elapsedTime.value += 1;
                updateProgress();
                if (timeRemaining.value > 0) {
                    timeRemaining.value -= 1;

                    if (timeRemaining.value === 0) {
                        clearInterval(timer);
                        completeTask();
                    }
                }
            }, 1000);
        };

        // 监听页面失焦（仅测试任务）
        const handleBlur = () => {
            if (props.taskType === 'exam') {
                lostFocusCount.value += 1;
                if (lostFocusCount.value > 5) {
                    isTaskCompleted.value = true;
                    clearInterval(timer);
                    reportCheating();
                    alert('检测到异常操作，考试结束。');
                }
            }
        };

        // 报告作弊退出
        const reportCheating = async () => {
            try {
                await axios.post('/api/tasks/reportCheating', { taskId: props.taskId });
            } catch (error) {
                console.error("报告作弊失败:", error);
            }
        };

        // 记录失焦次数（仅测试任务）
        const lostFocusCount = ref(0);

        // 全屏模式（仅测试任务）
        const enterFullScreen = () => {
            if (props.taskType === 'exam') {
                const elem = document.documentElement;
                if (elem.requestFullscreen) {
                    elem.requestFullscreen();
                } else if ((elem as any).webkitRequestFullscreen) { /* Safari */
                    (elem as any).webkitRequestFullscreen();
                } else if ((elem as any).msRequestFullscreen) { /* IE11 */
                    (elem as any).msRequestFullscreen();
                }
            }
        };

        const exitFullScreen = () => {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if ((document as any).webkitExitFullscreen) { /* Safari */
                (document as any).webkitExitFullscreen();
            } else if ((document as any).msExitFullscreen) { /* IE11 */
                (document as any).msExitFullscreen();
            }
        };

        const splitTextToLines = (text: string, containerWidth: number, font: string) => {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            if (!context) {
                console.error("无法获取 2D 上下文");
                return []; // 或者返回其他默认值
            }
            context.font = font;

            const words = text.content.split('');
            let currentLine = '';
            const lines = [];

            words.forEach((char: string) => {
                const testLine = currentLine + char;
                const testWidth = context.measureText(testLine).width;

                // 如果宽度超出容器，或者遇到换行符，切换到新行
                if (testWidth > containerWidth || char === '\n') {
                    lines.push(currentLine);
                    currentLine = char === '\n' ? '' : char; // 遇到换行符则新行从空开始
                } else {
                    currentLine = testLine;
                }
            });

            if (currentLine) lines.push(currentLine); // 添加最后一行
            return lines;
        };

        // 生命周期钩子
        onMounted(() => {
            loadTask();
            startTimer();
            enterFullScreen();
            if (props.taskType === 'exam') {
                window.addEventListener('blur', handleBlur);
            }
        });

        // 清理
        onBeforeUnmount(() => {
            clearInterval(timer);
            exitFullScreen();
            if (props.taskType === 'exam') {
                window.removeEventListener('blur', handleBlur);
            }
        });


        const formattedParagraphs = computed(() => {
            if (!article || article.value == "") return "";
            const containerWidth = document.querySelector(".task-content").clientWidth * 0.98;
            const font = '20px Microsoft YaHei';

            return splitTextToLines(article.value, containerWidth, font);
        });


        return {
            article,
            lines,
            userInput,
            typingSpeed,
            elapsedTime,
            timeRemaining,
            progress,
            getCharClass,
            onInputChange,
            onBackspace,
            formatTime,
            inputs,
            isTaskCompleted,
            formattedParagraphs,
            progressStatus: computed(() => {
                if (progress.value >= 100) return 'success';
                return 'warning';
            }),
            currentLine,
        };
    },
});
</script>
<style scoped>
.centered-title {
    text-align: center;
    font-size: 30px;
    font-family: "Microsoft YaHei";
    color: #333;
    margin: 20px auto;
}

.task-header {
    margin: 20px auto;
    padding: 10px;
    width: 95%;
    font-size: 16px;
    height: 25px;
    font-family: "Microsoft YaHei";
    color: #000;
    text-align: center;
    border: 2px solid #ccc;
    border-radius: 10px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    background-color: #fff;
    z-index: 999;
    opacity: 0.8;
}

.task-header span {
    line-height: 25px;
}

.task-content {
    margin-top: 20px;
    width: 90%;
    margin: 1.5em auto 0 auto;
}

.task-line {
    display: flex;
    align-items: center;
    margin-bottom: 15px;
}

.original-text {
    /* flex: 1; */
    font-size: 20px;
    font-family: "Microsoft YaHei";
    line-height: 1.5;
}

.original-text span {
    /* 默认字符样式 */
    color: #333;
}

.correct-char {
    color: green !important;
}

.error-char {
    color: red !important;
    font-weight: bold;
}

.neutral-char {
    color: #333 !important;
}

.task-line input {
    flex: 1;
    margin-left: 20px;
    padding: 5px;
    font-size: 18px;
}

.text-input {
    width: 100%;
    height: 30px;
    font-size: 20px;
    line-height: 1.5;
    font-family: "Microsoft YaHei";
    border: 2px solid #ccc;
    border-radius: 10px;
    outline: none;
    transition: border-color 0.3s;
    padding: 5px;
}

.text-input:focus {
    border-color: #66afe9;
    box-shadow: 0 0 8px rgba(102, 175, 233, 0.6);
}

input:disabled {
    background-color: #f5f5f5;
}
</style>
