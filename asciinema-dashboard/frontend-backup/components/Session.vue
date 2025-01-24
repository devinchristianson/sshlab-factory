<script setup lang="ts">
import { ArrowRightEndOnRectangleIcon, ArrowLeftStartOnRectangleIcon } from '@heroicons/vue/24/solid';
import TOTP from './TOTP.vue';
import { trpc } from '../utils';
import { useQuery } from '@tanstack/vue-query';
    const { data, isError, error } = useQuery({
        queryKey: ['username'],
        queryFn: async () => trpc.getUsername.query(),
    })
</script>

<template>
    <div v-if="data" class="flex flex-row p-2 gap-2">
        <TOTP class="grow"/>
        <div>
            {{ data }}
        </div>
        <Popper offsetDistance="4" interactive="false" content="Log Out" hover>
            <a href="/auth/signout">
                <ArrowLeftStartOnRectangleIcon class="h-6 w-6 cursor-pointer text-blue-500" />
            </a>
        </Popper>
    </div>
    <Popper v-else content="Log In" offsetDistance="4" interactive="false" hover>
        <a href="/auth/signin">
            <ArrowRightEndOnRectangleIcon class="h-6 w-6 cursor-pointer text-blue-500" />
        </a>
    </Popper>
</template>