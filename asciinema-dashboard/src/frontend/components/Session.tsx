import { ArrowRightEndOnRectangleIcon, ArrowLeftStartOnRectangleIcon } from '@heroicons/react/24/solid';
import TOTP from './TOTP';
import { trpc } from '../utils';
import Popper from './Popover';

function Session() {
    const {data }= trpc.getUsername.useQuery()
    if (data) {
        return (
            <div v-if="data" className="flex flex-row p-2 gap-2">
                <TOTP/>
                <div>
                { data }
                </div>
                <Popper content="Log Out">
                    <a href="/auth/signout">
                        <ArrowLeftStartOnRectangleIcon className="h-6 w-6 cursor-pointer text-blue-500" />
                    </a>
                </Popper>
            </div>
        );
    } else {
        return (
            <Popper content="Log In">
                <a href="/auth/signin">
                    <ArrowRightEndOnRectangleIcon className="h-6 w-6 cursor-pointer text-blue-500" />
                </a>
            </Popper>
        );
    }
}
export default Session;