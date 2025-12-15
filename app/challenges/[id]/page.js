import { createClient } from '@supabase/supabase-js';
import ChallengeClient from './ChallengeClient';

// Init Supabase (Server Side)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function generateMetadata({ params }) {
    const { id } = params;

    const { data: challenge } = await supabase
        .from('challenges')
        .select('match_name, wage, creator_pick')
        .eq('id', id)
        .single();

    if (!challenge) {
        return {
            title: 'Desafio não encontrado | Rei do Pote',
        };
    }

    const pickDisplay = challenge.creator_pick === 'home' ? 'Casa' : 'Visitante';

    return {
        title: `Desafio X1: ${challenge.match_name} | Rei do Pote`,
        description: `Aposte R$ ${challenge.wage} contra mim! Meu palpite: ${pickDisplay}. Quem ganhar leva o pote!`,
        openGraph: {
            title: `Desafio X1: ${challenge.match_name}`,
            description: `R$ ${challenge.wage} em jogo. Topa o desafio?`,
            images: ['/logo.png'], // Could generate a dynamic og-image later
        },
    };
}

export default function ChallengePage({ params }) {
    return <ChallengeClient params={params} />;
}
