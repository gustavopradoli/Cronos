import { useEffect, useState } from 'react';
import App from '../App';
import Layout from '../components/layout/Layout';
import { OrchestratorScreen } from '../pages/OrchestratorScreen';
import Historico from '../pages/Historico';

function getPathname() {
    return window.location.pathname.replace(/\/$/, '') || '/';
}

export default function Routes() {
    const [pathname, setPathname] = useState(getPathname);

    useEffect(() => {
        function handlePopState() {
            setPathname(getPathname());
        }

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    if (pathname === '/orquestrador') {
        return (
            <Layout activeItem="automations">
                <OrchestratorScreen />
            </Layout>
        );
    }
    if (pathname === '/historico') {
        return (
            <Layout activeItem="historico">
                <Historico />
            </Layout>
        );
    }


    return <App />;
}
