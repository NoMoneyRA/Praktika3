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
        toggleEdit() {
            if (!this.isEditing) {
                this.editedTask = { ...this.task };
            }
            this.isEditing = !this.isEditing;
        },
        saveEdit() {
            this.task.title = this.editedTask.title;
            this.task.description = this.editedTask.description;
            this.task.deadline = this.editedTask.deadline;
            this.task.lastEdited = new Date().toLocaleString();
            this.isEditing = false;
            this.$emit('update-storage');
        },
        returnTask() {
            if (!this.returnReason.trim()) {
                alert('Укажите причину возврата');
                return;
            }
            this.task.returnReason = this.returnReason;
            this.$emit('return-task', this.task, this.colIndex, this.returnReason);
            this.returnReason = '';
        }
    },
    template: `
    <div class="task" :class="taskStatus">
        <div>
            <p>{{ task.title }}</p>
        </div>
        <div>
            <p>{{ task.description }}</p>
        </div>
        <div>
            <p>Дэдлайн: {{ task.deadline }}</p>
        </div>
        <p>Создано: {{ task.createdAt }}</p>
        <p>Изменено: {{ task.lastEdited }}</p>
        <p v-if="task.returnReason">Причина возврата: {{ task.returnReason }}</p>
        <p v-if="colIndex === columnsLength - 1">
            {{ taskStatus === 'completed' ? 'Выполнено в срок' : 'Просрочено' }}
        </p>
        <button @click="$emit('delete-task', task, colIndex)">Удалить</button>
        <button v-if="colIndex < columnsLength - 1" @click="$emit('move-task', task, colIndex, colIndex + 1)">Далее</button>
        <div v-if="colIndex === 2">
            <textarea v-model="returnReason" placeholder="Причина возврата"></textarea>
            <button @click="returnTask">Вернуть</button>
        </div>
    </div>
    `
});

Vue.component('task-column', {
    props: ['column', 'index', 'columnsLength', 'searchQuery'],
    computed: {
        filteredTasks() {
            return this.column.tasks.filter(task => task.title.toLowerCase().includes(this.searchQuery.toLowerCase()));
        }
    },
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
        <task-card v-for="task in filteredTasks" 
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
            newTask: { title: '', description: '', deadline: '' },
            searchQuery: ''
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
        <input v-model="searchQuery" class="search-form" placeholder="Поиск по названию">
        <div class="task-form">
            <input v-model="newTask.title" placeholder="Название">
            <input v-model="newTask.description" placeholder="Описание">
            <input type="date" v-model="newTask.deadline">
            <button @click="addTask">Добавить задачу</button>
        </div>
        <div class="board">
            <task-column v-for="(column, index) in columns" 
                         :key="index" 
                         :column="column" 
                         :index="index" 
                         :columnsLength="columns.length"
                         :searchQuery="searchQuery"
                         @delete-task="deleteTask" 
                         @move-task="moveTask"
                         @update-storage="saveToLocalStorage">
            </task-column>
        </div>
    </div>
    `
});
