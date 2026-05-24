import { useState } from "react";

const FormulaireComplet = () => {
  // États individuels pour chaque champ
  const [nom, setNom] = useState("");
  const [dateNaissance, setDateNaissance] = useState("");
  const [loisirs, setLoisirs] = useState([]);
  const [accepteConditions, setAccepteConditions] = useState(false);
  const [fichierProfil, setFichierProfil] = useState(null);
  const [satisfaction, setSatisfaction] = useState(50);

  const [showModal, setShowModal] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const donnees = {
      nom,
      dateNaissance,
      loisirs,
      accepteConditions,
      fichierProfil,
      satisfaction,
    };
    console.log("Données soumises :", donnees);
    alert("Formulaire soumis avec succès (voir console)");
    setShowModal(false);
  };

  // Gestion des loisirs (cases à cocher)
  const handleLoisirChange = (loisir) => {
    setLoisirs((prev) =>
      prev.includes(loisir)
        ? prev.filter((l) => l !== loisir)
        : [...prev, loisir]
    );
  };

  // Ouvre le modal
  const handleOpenModal = () => {
    setShowModal(true);
  };

  // Ferme le modal
  const handleCloseModal = () => {
    setShowModal(false);
  };

  return (
    <>
      {/* ===== Formulaire ===== */}
      <form
        onSubmit={handleSubmit}
        className="max-w-2xl mx-auto bg-white p-8 border border-slate-200 rounded-xl shadow-sm space-y-6"
      >
        <h2 className="text-2xl font-bold text-slate-900">
          Formulaire (champs sélectionnés)
        </h2>

        {/* Nom */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-slate-700">
            Nom complet
          </label>
          <input
            type="text"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Jean Dupont"
            className="h-10 rounded-lg border border-slate-200 px-3 text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
          />
        </div>

        {/* Date de naissance */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-slate-700">
            Date de naissance
          </label>
          <input
            type="date"
            value={dateNaissance}
            onChange={(e) => setDateNaissance(e.target.value)}
            className="h-10 rounded-lg border border-slate-200 px-3 text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
          />
        </div>

        {/* Loisirs */}
        <fieldset className="flex flex-col gap-1">
          <legend className="text-sm font-semibold text-slate-700">
            Loisirs (plusieurs possibles)
          </legend>
          <div className="flex flex-wrap gap-4 mt-1">
            {["Sport", "Lecture", "Musique", "Voyages", "Cuisine"].map(
              (loisir) => (
                <label
                  key={loisir}
                  className="flex items-center gap-2 text-sm text-slate-600"
                >
                  <input
                    type="checkbox"
                    checked={loisirs.includes(loisir)}
                    onChange={() => handleLoisirChange(loisir)}
                    className="rounded"
                  />
                  {loisir}
                </label>
              )
            )}
          </div>
        </fieldset>

        {/* Conditions générales */}
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={accepteConditions}
            onChange={(e) => setAccepteConditions(e.target.checked)}
            className="rounded"
          />
          J'accepte les conditions générales
        </label>

        {/* Fichier profil */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-slate-700">
            Photo de profil
          </label>
          <input
            type="file"
            onChange={(e) => setFichierProfil(e.target.files[0])}
            className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
          />
        </div>

        {/* Curseur satisfaction */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-slate-700">
            Niveau de satisfaction ({satisfaction}%)
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={satisfaction}
            onChange={(e) => setSatisfaction(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-500"
          />
        </div>

        {/* Boutons du formulaire */}
        <div className="flex gap-3">
          {/* Bouton pour ouvrir le modal */}
          <button
            type="button"
            onClick={handleOpenModal}
            className="flex-1 py-3 px-4 bg-slate-100 text-slate-700 font-semibold rounded-lg border border-slate-200 hover:bg-slate-200 transition-colors"
          >
            Voir le récapitulatif
          </button>

          {/* Bouton de soumission directe (optionnel) */}
          <button
            type="submit"
            className="flex-1 py-3 px-4 bg-sky-500 text-white font-semibold rounded-lg hover:bg-sky-600 transition-colors"
          >
            Envoyer directement
          </button>
        </div>
      </form>

      {/* ===== Modal ===== */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-slate-900 mb-4">
              Récapitulatif de votre saisie
            </h3>

            {/* Affichage des valeurs des champs */}
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-semibold text-slate-600">Nom :</span>{" "}
                {nom || <span className="text-slate-400">Non renseigné</span>}
              </div>
              <div>
                <span className="font-semibold text-slate-600">
                  Date de naissance :
                </span>{" "}
                {dateNaissance || (
                  <span className="text-slate-400">Non renseignée</span>
                )}
              </div>
              <div>
                <span className="font-semibold text-slate-600">Loisirs :</span>{" "}
                {loisirs.length > 0 ? (
                  loisirs.join(", ")
                ) : (
                  <span className="text-slate-400">Aucun</span>
                )}
              </div>
              <div>
                <span className="font-semibold text-slate-600">
                  Conditions acceptées :
                </span>{" "}
                {accepteConditions ? "Oui" : "Non"}
              </div>
              <div>
                <span className="font-semibold text-slate-600">
                  Fichier profil :
                </span>{" "}
                {fichierProfil ? fichierProfil.name : "Aucun fichier"}
              </div>
              <div>
                <span className="font-semibold text-slate-600">
                  Satisfaction :
                </span>{" "}
                {satisfaction}%
              </div>
            </div>

            {/* Actions du modal */}
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={handleCloseModal}
                className="flex-1 py-2 px-4 border border-slate-200 rounded-lg text-slate-700 font-semibold hover:bg-slate-50"
              >
                Modifier
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="flex-1 py-2 px-4 bg-sky-500 text-white font-semibold rounded-lg hover:bg-sky-600"
              >
                Confirmer l'envoi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FormulaireComplet;