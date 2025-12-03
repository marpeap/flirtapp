export default function LegalPage() {
  return (
    <main>
      <div className="card">
        <h1>Conditions générales d’utilisation (version courte)</h1>
        <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 12 }}>
          Ce texte donne un cadre minimum pour utiliser le site. Il ne remplace
          pas un avis juridique professionnel : fais-toi accompagner par un·e
          avocat·e avant un lancement commercial réel.
        </p>

        <section style={{ marginBottom: 14 }}>
          <h2>1. Objet du service</h2>
          <p style={{ fontSize: 14 }}>
            Ce site permet à des adultes de créer un profil, parcourir d’autres
            profils et échanger des messages privés dans le but de rencontres
            amicales, romantiques ou sexuelles consenties.
          </p>
        </section>

        <section style={{ marginBottom: 14 }}>
          <h2>2. Accès réservé aux adultes</h2>
          <p style={{ fontSize: 14 }}>
            Le service est strictement réservé aux personnes âgées d’au moins
            18 ans. Tu t’engages à ne pas créer de compte ni utiliser le site
            si tu es mineur.
          </p>
        </section>

        <section style={{ marginBottom: 14 }}>
          <h2>3. Comportements interdits</h2>
          <p style={{ fontSize: 14 }}>
            Tu t’engages à ne pas harceler d’autres membres, ne pas publier de
            contenus illégaux, violents, discriminatoires ou non consentis, et
            à respecter les lois en vigueur dans ton pays. Le site peut
            suspendre ou fermer tout compte en cas d’abus signalé ou constaté.
          </p>
        </section>

        <section style={{ marginBottom: 14 }}>
          <h2>4. Données personnelles et confidentialité</h2>
          <p style={{ fontSize: 14 }}>
            Les informations de ton profil et tes messages sont stockés sur les
            serveurs du prestataire technique (par exemple Supabase / Vercel).
            Les données ne sont utilisées que pour faire fonctionner le site.
            Tu peux demander la suppression de ton compte et de tes données via
            le moyen de contact indiqué en bas de page.
          </p>
        </section>

        <section style={{ marginBottom: 14 }}>
          <h2>5. Limitation de responsabilité</h2>
          <p style={{ fontSize: 14 }}>
            Le site ne vérifie pas l’identité réelle des membres et ne garantit
            pas la sincérité des profils. Tu restes pleinement responsable de
            tes rencontres et échanges, notamment lors de rendez-vous physiques.
          </p>
        </section>

        <section style={{ marginBottom: 14 }}>
          <h2>6. Signalement et sécurité</h2>
          <p style={{ fontSize: 14 }}>
            En cas de comportement inquiétant, de fraude ou de soupçon
            d’illégalité, tu es invité à signaler le profil concerné et, si
            nécessaire, à contacter les autorités compétentes. Ne partage jamais
            tes informations bancaires ou documents d’identité avec d’autres
            membres.
          </p>
        </section>

        <section>
          <h2>7. Modification des conditions</h2>
          <p style={{ fontSize: 14 }}>
            Ces conditions pourront évoluer à mesure que le projet avance. Une
            version mise à jour sera publiée sur cette page avec une date de
            dernière modification.
          </p>
        </section>
      </div>
    </main>
  );
}

