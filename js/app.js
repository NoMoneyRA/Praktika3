Vue.component('task-card', {
    props: ['task', 'colIndex', 'columnsLength'],
    data() {
        return {
            isEditing: false,
            editedTask: { title: '', description: '', deadline: '' },
            returnReason: '',
        };
    },
    computed: {
        taskStatus() {
            if (this.colIndex === this.columnsLength - 1) {
                const deadlineDate = new Date(this.task.deadline);
                const now = new Date();
                return deadlineDate >= now ? 'completed' : 'overdue';
            }
            return '';
        }
    },
    methods: {

    },

});

Vue.component('task-column', {
    props: ['column', 'index', 'columnsLength'],
    methods: {
        returnTask(task, colIndex, reason) {
            this.$emit('move-task', task, colIndex, 1);
            task.returnReason = reason;
            this.$emit('update-storage');
        }
    },
    template: `
    <div class="column">
        <h3>{{ column.title }}</h3>
        <task-card v-for="task in column.tasks" 
                   :key="task.createdAt" 
                   :task="task" 
                   :colIndex="index" 
                   :columnsLength="columnsLength"
                   @delete-task="$emit('delete-task', task, index)"
                   @move-task="$emit('move-task', task, index, index + 1)"
                   @return-task="returnTask"
                   @update-storage="$emit('update-storage')">
        </task-card>
    </div>
    `
});

new Vue({
    el: '#app',
    data() {
        return {
            columns: JSON.parse(localStorage.getItem('kanbanColumns')) || [
                { title: 'Запланированные задачи', tasks: [] },
                { title: 'В работе', tasks: [] },
                { title: 'Тестирование', tasks: [] },
                { title: 'Выполненные задачи', tasks: [] }
            ],
            newTask: { title: '', description: '', deadline: '' }
        };
    },
    methods: {
        saveToLocalStorage() {
            localStorage.setItem('kanbanColumns', JSON.stringify(this.columns));
        },
        addTask() {
            if (!this.newTask.title || !this.newTask.description || !this.newTask.deadline) return;
            this.columns[0].tasks.push({
                ...this.newTask,
                createdAt: new Date().toLocaleString(),
                lastEdited: new Date().toLocaleString()
            });
            this.newTask = { title: '', description: '', deadline: '' };
            this.saveToLocalStorage();
        },
        deleteTask(task, colIndex) {
            this.columns[colIndex].tasks = this.columns[colIndex].tasks.filter(t => t !== task);
            this.saveToLocalStorage();
        },
        moveTask(task, fromColumn, toColumn) {
            if (toColumn >= this.columns.length) return;
            this.columns[fromColumn].tasks = this.columns[fromColumn].tasks.filter(t => t !== task);
            this.columns[toColumn].tasks.push(task);
            task.lastEdited = new Date().toLocaleString();
            this.saveToLocalStorage();
        }
    },
    template: `
    <div>
        <div class="task-form">
            <input v-model="newTask.title" placeholder="Название">
            <input v-model="newTask.description" placeholder="Описание">
        </div>
        <div class="board">
            <task-column v-for="(column, index) in columns" 
                         :key="index" 
                         :column="column" 
                         :index="index" 
                         :columnsLength="columns.length"
                         @delete-task="deleteTask" 
                         @move-task="moveTask"
                         @update-storage="saveToLocalStorage">
            </task-column>
        </div>
    </div>
    `
});
