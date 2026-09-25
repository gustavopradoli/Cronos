import { useEffect, useState } from 'react';
import App from '../App';
import Layout from '../components/layout/Layout';
import { OrchestratorScreen } from '../pages/OrchestratorScreen';
import Gatilhos from '../pages/Gatilhos';
import Maquinas from '../pages/Maquinas';
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

    if (pathname === '/orquestrador' || pathname === '/automacoes') {
        return (
            <Layout activeItem="automation-cadastro">
                <OrchestratorScreen />
            </Layout>
        );
    }

    if (pathname === '/gatilhos') {
        return (
            <Layout activeItem="automation-trigger">
                <Gatilhos />
            </Layout>
        );
    }

    if (pathname === '/maquinas') {
        return (
            <Layout activeItem="automation-machines">
                <Maquinas />
            </Layout>
        );
    }

    if (pathname === '/historico') {
        return (
            <Layout activeItem="automation-history">
                <Historico />
            </Layout>
        );
    }

    return <App />;
}
