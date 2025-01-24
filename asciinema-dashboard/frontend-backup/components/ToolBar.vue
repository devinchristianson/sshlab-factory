<script setup lang="ts">
    import { ArrowPathIcon,ForwardIcon,TrashIcon } from '@heroicons/vue/24/solid';
    import { usePlayerStore } from '../store';
    import Session from './Session.vue';
    const store = usePlayerStore();
</script>
<template>
    <div class="bg-gray-900 flex flex-row items-center justify-between gap-2 px-2 shrink">
        <div class="flex flex-row p-2 gap-2">
            <Popper content="Fast Forward" hover>
                <ForwardIcon @click="store.toggleFastForward" :class="['h-6', 'w-6','cursor-pointer',  (store.$state.fastforward ? 'text-blue-500' : 'text-gray-500')]"/>
            </Popper>
            <Popper content="Reset Players" hover>
                <ArrowPathIcon @click="store.resetPlayers" class="h-6 w-6 cursor-pointer text-blue-500"/>
            </Popper>
            <Popper content="Include exited sessions?" hover>
                <TrashIcon @click="store.toggleIncludeExited" :class="['h-6', 'w-6','cursor-pointer',  (store.$state.includeExited ? 'text-blue-500' : 'text-gray-500')]"/>
            </Popper>
            <router-link to="/">
              Home
            </router-link>
            <router-link to="/intro">
              About
            </router-link>
            <router-link to="/wiki/index.md">
              Wiki
            </router-link>
        </div>
        <Session/>
    </div>
</template>