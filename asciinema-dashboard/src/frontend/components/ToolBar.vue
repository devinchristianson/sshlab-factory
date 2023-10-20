<script setup lang="ts">
    import { ArrowPathIcon,ForwardIcon,TrashIcon } from '@heroicons/vue/24/solid';
    import { usePlayerStore } from '../store';
    const store = usePlayerStore();
</script>
<template>
    <div class="bg-gray-900">
        <div class="flex flex-row items-center p-2 gap-2">
            <Popper content="Fast Forward" hover>
                <ForwardIcon @click="store.toggleFastForward" :class="['h-6', 'w-6',  (store.$state.fastforward ? 'text-blue-500' : 'text-gray-500')]"/>
            </Popper>
            <Popper content="Reset Players" hover>
                <ArrowPathIcon @click="store.resetPlayers" class="h-6 w-6 text-blue-500"/>
            </Popper>
            <Popper content="Include exited sessions?" hover>
                <TrashIcon @click="store.toggleIncludeExited" :class="['h-6', 'w-6',  (store.$state.includeExited ? 'text-blue-500' : 'text-gray-500')]"/>
            </Popper>
        </div>
    </div>
</template>