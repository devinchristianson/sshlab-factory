import { ArrowPathIcon,ForwardIcon,TrashIcon } from '@heroicons/react/24/solid';
import Session from './Session';
import { usePlayerStore } from '../store';
import { Link } from 'react-router-dom';

function ToolBar() {
    const store = usePlayerStore()
    return <div className="bg-gray-900 flex flex-row items-center justify-between gap-2 px-2 shrink">
    <div className="flex flex-row p-2 gap-2">
    <ForwardIcon onClick={store.toggleFastForward} className={`h-6 w-6 cursor-pointer ${(store.fastforward ? 'text-blue-500' : 'text-gray-500')}`}/>
    <ArrowPathIcon onClick={store.resetPlayers} className="h-6 w-6 cursor-pointer text-blue-500"/>
    <TrashIcon onClick={store.toggleIncludeExited} className={`h-6 w-6 cursor-pointer ${(store.includeExited ? 'text-blue-500' : 'text-gray-500')}`}/>
        <Link to="/">
          Home
        </Link>
        <Link to="/intro">
          About
        </Link>
        <Link to="/wiki/index.md">
          Wiki
        </Link>
    </div>
    <Session/>
</div>
}

export default ToolBar;