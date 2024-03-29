<script setup lang="ts">
import type { Session } from '@auth/express';
import { ArrowRightEndOnRectangleIcon, ArrowLeftStartOnRectangleIcon } from '@heroicons/vue/24/solid';
import { ref } from "vue";
import TOTP from './TOTP.vue';
const session = ref<Session>();
fetch("/session").then((response) => {
    response.json().then((data) => {
        session.value = data
    }).catch((error) => {
        console.error(error)
    })
}).catch((error) => {
    console.error(error)
})
</script>

<template>
    <div v-if="session" class="flex flex-row p-2 gap-2">
        <TOTP class="grow"/>
        <div>
            {{ session.user?.email }}
        </div>
        <Popper offsetDistance="4" interactive="false" content="Log Out" hover>
        <ArrowLeftStartOnRectangleIcon class="h-6 w-6 cursor-pointer text-blue-500" />
        </Popper>
    </div>
    <Popper v-else content="Log In" offsetDistance="4" interactive="false" hover>
        <ArrowRightEndOnRectangleIcon class="h-6 w-6 cursor-pointer text-blue-500" />
    </Popper>
</template>