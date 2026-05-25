const Dictionnaire = () => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 mb-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-4">
        Vérification des stocks
      </h2>
      <div className="space-y-3">
        {Object.keys(stockTab).length === 0 ? (
          <p className="text-sm text-slate-500">
            Aucune information de stock disponible.
          </p>
        ) : (
          Object.entries(stockTab).map(([productId, info]) => {
            const isStockOk = info.stock >= info.requested;
            return (
              <div
                key={productId}
                className="flex items-center justify-between bg-slate-50 rounded-lg p-3"
              >
                <div>
                  <p className="font-medium text-sm text-slate-900">
                    {info.name}
                  </p>
                  <p className="text-xs text-slate-500">ID: {productId}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-xs text-slate-500">Stock dispo</p>
                    <p className={`font-semibold `}>{info.stock}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-500">Demandé</p>
                    <p className="font-semibold text-slate-900">
                      {info.requested}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
export default Dictionnaire;
