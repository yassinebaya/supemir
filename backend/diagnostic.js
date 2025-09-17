// Helper to extract actor info
function getActorFromReq(req, type) {
  return {
    lastActionById:    req.user?.id || req.user?._id || null,
    lastActionByName:  req.user?.nom || req.user?.name || null,
    lastActionByEmail: req.user?.email || null,
    lastActionByRole:  req.user?.role || null,
    lastActionAt:      new Date(),
    lastActionType:    type
  };
}

app.post('/api/seances', authAdmin, async (req, res) => {
  try {
    const { jour, heureDebut, heureFin, cours, professeur, matiere, salle } = req.body;
    if (!jour || !heureDebut || !heureFin || !cours || !professeur) {
      return res.status(400).json({ message: 'Tous les champs sont requis' });
    }
    const coursDoc = await Cours.findById(cours);
    if (!coursDoc) {
      return res.status(404).json({ message: 'Cours non trouvé' });
    }
    const seance = new Seance({
      jour,
      heureDebut,
      heureFin,
      cours: coursDoc.nom,
      coursId: coursDoc._id,
      professeur,
      matiere: matiere || '',
      salle: salle || '',
      ...getActorFromReq(req, 'creation')
    });
    await seance.save();
    res.status(201).json({ message: 'Séance ajoutée avec succès', seance });
  } catch (err) {
    console.error('Erreur ajout séance:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

app.post('/api/seances/exception', authAdmin, async (req, res) => {
  try {
    const { cours, professeur, matiere, salle, dateSeance, jour, heureDebut, heureFin } = req.body;
    if (!dateSeance) {
      return res.status(400).json({ ok: false, error: 'La date de séance est obligatoire' });
    }
    const coursDoc = await Cours.findById(cours);
    if (!coursDoc) {
      return res.status(404).json({ ok: false, error: 'Cours non trouvé' });
    }
    // Date range for exception
    const d = new Date(dateSeance);
    const dayStart = new Date(d); dayStart.setHours(0,0,0,0);
    const dayEnd   = new Date(dayStart); dayEnd.setDate(dayEnd.getDate() + 1);
    const q = {
      cours: coursDoc.nom,
      coursId: coursDoc._id,
      dateSeance: { $gte: dayStart, $lt: dayEnd },
      heureDebut,
      heureFin,
      typeSeance: 'exception'
    };
    const update = {
      cours: coursDoc.nom,
      coursId: coursDoc._id,
      professeur,
      matiere,
      salle,
      jour,
      dateSeance: new Date(dateSeance),
      typeSeance: 'exception',
      actif: true,
      ...getActorFromReq(req, 'creation')
    };
    const doc = await Seance.findOneAndUpdate(
      q,
      { $set: update },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).populate('professeur', 'nom email estPermanent tarifHoraire');
    return res.json({ ok: true, seance: doc });
  } catch (err) {
    console.error('❌ Erreur exception:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/pedagogique/seances/exception', authPedagogique, async (req, res) => {
  try {
    const { cours, professeur, matiere, salle, dateSeance, jour, heureDebut, heureFin } = req.body;
    if (!dateSeance) {
      return res.status(400).json({ ok: false, error: 'La date de séance est obligatoire' });
    }
    const coursDoc = await Cours.findById(cours);
    if (!coursDoc) {
      return res.status(404).json({ ok: false, error: 'Cours non trouvé' });
    }
    if (req.user.filiere !== 'GENERAL') {
      const etudiants = await Etudiant.find({ filiere: req.user.filiere, actif: true, cours: coursDoc.nom });
      if (etudiants.length === 0) {
        return res.status(403).json({ ok: false, error: `Vous n'avez pas l'autorisation de créer des séances pour le cours "${coursDoc.nom}"` });
      }
    }
    // Date range for exception
    const d = new Date(dateSeance);
    const dayStart = new Date(d); dayStart.setHours(0,0,0,0);
    const dayEnd   = new Date(dayStart); dayEnd.setDate(dayEnd.getDate() + 1);
    const q = {
      cours: coursDoc.nom,
      coursId: coursDoc._id,
      dateSeance: { $gte: dayStart, $lt: dayEnd },
      heureDebut,
      heureFin,
      typeSeance: 'exception'
    };
    const update = {
      cours: coursDoc.nom,
      coursId: coursDoc._id,
      professeur,
      matiere,
      salle,
      jour,
      dateSeance: new Date(dateSeance),
      typeSeance: 'exception',
      actif: true,
      creeParPedagogique: req.user.id,
      ...getActorFromReq(req, 'creation')
    };
    const doc = await Seance.findOneAndUpdate(
      q,
      { $set: update },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).populate('professeur', 'nom email estPermanent tarifHoraire');
    return res.json({ ok: true, seance: doc });
  } catch (err) {
    console.error('Erreur exception pédagogique:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

app.put('/api/seances/:id', authAdmin, async (req, res) => {
  try {
    const { jour, heureDebut, heureFin, cours, professeur, matiere, salle } = req.body;
    const coursDoc = await Cours.findById(cours);
    if (!coursDoc) {
      return res.status(404).json({ message: 'Cours non trouvé' });
    }
    const updateData = {
      jour,
      heureDebut,
      heureFin,
      cours: coursDoc.nom,
      coursId: coursDoc._id,
      professeur,
      matiere: matiere || '',
      salle: salle || '',
      ...getActorFromReq(req, 'modification')
    };
    const seance = await Seance.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    if (!seance) {
      return res.status(404).json({ message: 'Séance non trouvée' });
    }
    res.json({ message: 'Séance modifiée avec succès', seance });
  } catch (err) {
    console.error('Erreur modification séance:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

app.put('/api/pedagogique/seances/:id', authPedagogique, async (req, res) => {
  try {
    const { jour, heureDebut, heureFin, cours, professeur, matiere, salle } = req.body;
    const seanceExistante = await Seance.findById(req.params.id);
    if (!seanceExistante) {
      return res.status(404).json({ message: 'Séance non trouvée' });
    }
    if (req.user.filiere !== 'GENERAL') {
      const etudiants = await Etudiant.find({ filiere: req.user.filiere, actif: true, cours: seanceExistante.cours });
      if (etudiants.length === 0) {
        return res.status(403).json({ message: `Vous n'avez pas l'autorisation de modifier cette séance` });
      }
    }
    let coursNom = cours;
    let coursId = seanceExistante.coursId;
    if (cours && mongoose.Types.ObjectId.isValid(cours)) {
      const coursDoc = await Cours.findById(cours);
      if (coursDoc) {
        coursNom = coursDoc.nom;
        coursId = coursDoc._id;
      }
    }
    if (!professeur) {
      return res.status(400).json({ message: 'Professeur requis' });
    }
    if (!matiere || matiere.trim() === '') {
      return res.status(400).json({ message: 'Matière requise' });
    }
    const updateData = {
      modifieParPedagogique: req.user.id,
      modifieAt: new Date(),
      ...getActorFromReq(req, 'modification')
    };
    if (jour) updateData.jour = jour;
    if (heureDebut) updateData.heureDebut = heureDebut;
    if (heureFin) updateData.heureFin = heureFin;
    if (coursNom) updateData.cours = coursNom;
    if (coursId) updateData.coursId = coursId;
    if (professeur) updateData.professeur = professeur;
    if (matiere !== undefined) updateData.matiere = matiere || '';
    if (salle !== undefined) updateData.salle = salle || '';
    const seance = await Seance.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('professeur', 'nom email estPermanent tarifHoraire');
    if (!seance) {
      return res.status(404).json({ message: 'Séance non trouvée après mise à jour' });
    }
    res.json({ message: 'Séance modifiée avec succès', seance });
  } catch (err) {
    console.error('❌ Erreur modification séance pédagogique:', err);
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: 'Erreur de validation', errors });
    }
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'ID de séance invalide' });
    }
    res.status(500).json({
      message: 'Erreur serveur',
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});
app.put('/api/seances/:id/rattrapage', authAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const seance = await Seance.findById(id);
    if (!seance) {
      return res.status(404).json({ error: 'Séance non trouvée' });
    }
    if (req.user.filiere !== 'GENERAL') {
      const etudiants = await Etudiant.find({ filiere: req.user.filiere, actif: true, cours: seance.cours });
      if (etudiants.length === 0) {
        return res.status(403).json({ error: `Vous n'avez pas l'autorisation de modifier cette séance` });
      }
    }
    seance.typeSeance = 'rattrapage';
    seance.modifieParPedagogique = userId;
    seance.notes = `Marquée en rattrapage le ${new Date().toLocaleString('fr-FR')} par ${req.user.nom || 'Pédagogique'}`;
    Object.assign(seance, getActorFromReq(req, 'modification'));
    await seance.save();
    res.json({ ok: true, message: 'Séance marquée en rattrapage', seance });
  } catch (error) {
    console.error('❌ Erreur marquer rattrapage:', error);
    res.status(500).json({ error: 'Erreur serveur lors du marquage rattrapage' });
  }
});
app.put('/api/pedagogique/seances/:id/rattrapage', authPedagogique, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const seance = await Seance.findById(id);
    if (!seance) {
      return res.status(404).json({ error: 'Séance non trouvée' });
    }
    if (req.user.filiere !== 'GENERAL') {
      const etudiants = await Etudiant.find({ filiere: req.user.filiere, actif: true, cours: seance.cours });
      if (etudiants.length === 0) {
        return res.status(403).json({ error: `Vous n'avez pas l'autorisation de modifier cette séance` });
      }
    }
    seance.typeSeance = 'rattrapage';
    seance.modifieParPedagogique = userId;
    seance.notes = `Marquée en rattrapage le ${new Date().toLocaleString('fr-FR')} par ${req.user.nom || 'Pédagogique'}`;
    Object.assign(seance, getActorFromReq(req, 'modification'));
    await seance.save();
    res.json({ ok: true, message: 'Séance marquée en rattrapage', seance });
  } catch (error) {
    console.error('❌ Erreur marquer rattrapage:', error);
    res.status(500).json({ error: 'Erreur serveur lors du marquage rattrapage' });
  }
});
app.delete('/api/seances/:id', authAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Seance.findById(id).lean();
    if (!doc) {
      return res.status(404).json({ ok: false, message: 'Séance introuvable' });
    }
    await AuditLog.create({
      entity:   'SEANCE',
      entityId: id,
      action:   'DELETE',
      actorId:    req.user?.id || req.user?._id || null,
      actorName:  req.user?.nom || req.user?.name || null,
      actorEmail: req.user?.email || null,
      actorRole:  req.user?.role || null,
      meta: { cours: doc.cours, jour: doc.jour, heureDebut: doc.heureDebut, heureFin: doc.heureFin }
    });
    await Seance.deleteOne({ _id: id });
    return res.json({ ok: true, deletedId: id });
  } catch (err) {
    console.error('Erreur suppression:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

app.delete('/api/pedagogique/seances/:id', authPedagogique, async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Seance.findById(id).lean();
    if (!doc) {
      return res.status(404).json({ ok: false, message: 'Séance introuvable' });
    }
    if (req.user.filiere !== 'GENERAL') {
      const etudiants = await Etudiant.find({ filiere: req.user.filiere, actif: true, cours: doc.cours });
      if (etudiants.length === 0) {
        return res.status(403).json({ ok: false, message: `Vous n'avez pas l'autorisation de supprimer cette séance` });
      }
    }
    await AuditLog.create({
      entity:   'SEANCE',
      entityId: id,
      action:   'DELETE',
      actorId:    req.user?.id || req.user?._id || null,
      actorName:  req.user?.nom || req.user?.name || null,
      actorEmail: req.user?.email || null,
      actorRole:  req.user?.role || null,
      meta: { cours: doc.cours, jour: doc.jour, heureDebut: doc.heureDebut, heureFin: doc.heureFin }
    });
    await Seance.deleteOne({ _id: id });
    return res.json({ ok: true, deletedId: id });
  } catch (err) {
    console.error('Erreur suppression:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/seances/copier-semaine', authAdminOrPedagogique, async (req, res) => {
  try {
    const { lundiSource, lundiDestination } = req.body;
    if (!lundiSource || !lundiDestination) {
      return res.status(400).json({ ok: false, error: 'Les dates source et destination sont obligatoires' });
    }
    const dateSource = new Date(lundiSource);
    const dimancheSource = new Date(dateSource);
    dimancheSource.setDate(dimancheSource.getDate() + 6);
    dimancheSource.setHours(23, 59, 59, 999);
    const seancesSource = await Seance.find({
      typeSeance: { $in: ['reelle', 'exception'] },
      dateSeance: { $gte: dateSource, $lte: dimancheSource },
      actif: true
    }).populate('professeur', 'nom email');
    if (seancesSource.length === 0) {
      return res.json({ ok: true, message: 'Aucune séance à copier pour cette semaine', seancesCrees: 0 });
    }
    const differenceJours = Math.round((new Date(lundiDestination) - new Date(lundiSource)) / (1000 * 60 * 60 * 24));
    const nouvellesSeances = [];
    const erreurs = [];
    for (const seanceSource of seancesSource) {
      try {
        const nouvelleDateSeance = new Date(seanceSource.dateSeance);
        nouvelleDateSeance.setDate(nouvelleDateSeance.getDate() + differenceJours);
        const coursDoc = await Cours.findOne({ nom: seanceSource.cours });
        const coursNom = coursDoc ? coursDoc.nom : seanceSource.cours;
        const coursId = coursDoc ? coursDoc._id : seanceSource.coursId;
        const seanceExistante = await Seance.findOne({
          cours: coursNom,
          dateSeance: nouvelleDateSeance,
          heureDebut: seanceSource.heureDebut,
          heureFin: seanceSource.heureFin,
          typeSeance: { $in: ['reelle', 'exception'] }
        });
        if (seanceExistante) continue;
        const nouvelleSeance = new Seance({
          cours: coursNom,
          coursId: coursId,
          professeur: seanceSource.professeur._id || seanceSource.professeur,
          matiere: seanceSource.matiere,
          salle: seanceSource.salle,
          dateSeance: nouvelleDateSeance,
          jour: seanceSource.jour,
          heureDebut: seanceSource.heureDebut,
          heureFin: seanceSource.heureFin,
          typeSeance: 'exception',
          actif: true,
          notes: `Copié depuis ${seanceSource.dateSeance.toISOString().split('T')[0]}`,
          ...getActorFromReq(req, 'creation')
        });
        await nouvelleSeance.save({ validateBeforeSave: true });
        nouvellesSeances.push(nouvelleSeance);
      } catch (error) {
        erreurs.push({ seanceId: seanceSource._id, cours: seanceSource.cours, erreur: error.message });
      }
    }
    const response = {
      ok: true,
      message: `${nouvellesSeances.length} séances copiées avec succès`,
      seancesCrees: nouvellesSeances.length,
      seancesSource: seancesSource.length,
      semaineSource: lundiSource,
      semaineDestination: lundiDestination,
      erreurs: erreurs.length > 0 ? erreurs : undefined
    };
    res.json(response);
  } catch (error) {
    console.error('Erreur lors de la copie de semaine:', error);
    res.status(500).json({
      ok: false,
      error: 'Erreur interne lors de la copie',
      details: error.message
    });
  }
});

app.post('/api/seances/copier-semaine-precedente', authAdminOrPedagogique, async (req, res) => {
  try {
    const { lundiDestination } = req.body;
    if (!lundiDestination) {
      return res.status(400).json({ ok: false, error: 'Date de destination obligatoire' });
    }
    const dateDestination = new Date(lundiDestination);
    const lundiSource = new Date(dateDestination);
    lundiSource.setDate(lundiSource.getDate() - 7);
    const dimancheSource = new Date(lundiSource);
    dimancheSource.setDate(dimancheSource.getDate() + 6);
    dimancheSource.setHours(23, 59, 59, 999);
    const seancesSource = await Seance.find({
      typeSeance: { $in: ['reelle', 'exception'] },
      dateSeance: { $gte: lundiSource, $lte: dimancheSource },
      actif: true
    });
    if (seancesSource.length === 0) {
      return res.json({ ok: true, message: 'Aucune séance à copier pour la semaine précédente', seancesCrees: 0 });
    }
    const nouvellesSeances = [];
    for (const seanceSource of seancesSource) {
      const nouvelleDateSeance = new Date(seanceSource.dateSeance);
      nouvelleDateSeance.setDate(nouvelleDateSeance.getDate() + 7);
      const coursDoc = await Cours.findOne({ nom: seanceSource.cours });
      const coursNom = coursDoc ? coursDoc.nom : seanceSource.cours;
      const coursId = coursDoc ? coursDoc._id : seanceSource.coursId;
      const existe = await Seance.findOne({
        cours: coursNom,
        dateSeance: nouvelleDateSeance,
        heureDebut: seanceSource.heureDebut,
        heureFin: seanceSource.heureFin
      });
      if (existe) continue;
      const nouvelleSeance = new Seance({
        cours: coursNom,
        coursId: coursId,
        professeur: seanceSource.professeur,
        matiere: seanceSource.matiere,
        salle: seanceSource.salle,
        dateSeance: nouvelleDateSeance,
        jour: seanceSource.jour,
        heureDebut: seanceSource.heureDebut,
        heureFin: seanceSource.heureFin,
        typeSeance: 'exception',
        actif: true,
        ...getActorFromReq(req, 'creation')
      });
      await nouvelleSeance.save({ validateBeforeSave: true });
      nouvellesSeances.push(nouvelleSeance);
    }
    res.json({ ok: true, message: `${nouvellesSeances.length} séances copiées`, seancesCrees: nouvellesSeances.length });
  } catch (error) {
    console.error('Erreur copie simple:', error);
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

app.post('/api/pedagogique/seances/copier-semaine', authPedagogique, async (req, res) => {
  try {
    const { lundiSource, lundiDestination } = req.body;
    if (!lundiSource || !lundiDestination) {
      return res.status(400).json({ ok: false, error: 'Les dates source et destination sont obligatoires' });
    }
    const dateSource = new Date(lundiSource);
    const dimancheSource = new Date(dateSource);
    dimancheSource.setDate(dimancheSource.getDate() + 6);
    dimancheSource.setHours(23, 59, 59, 999);
    const seancesSource = await Seance.find({
      typeSeance: { $in: ['reelle', 'exception'] },
      dateSeance: { $gte: dateSource, $lte: dimancheSource },
      actif: true
    }).populate('professeur', 'nom email');
    let seancesFiltrees = [];
    if (req.user.filiere === 'GENERAL') {
      seancesFiltrees = seancesSource;
    } else {
      const etudiants = await Etudiant.find({ filiere: req.user.filiere, actif: true });
      const coursDeFiliere = new Set();
      etudiants.forEach(etudiant => {
        if (etudiant.cours && Array.isArray(etudiant.cours)) {
          etudiant.cours.forEach(coursNom => {
            coursDeFiliere.add(coursNom);
          });
        }
      });
      seancesFiltrees = seancesSource.filter(seance => coursDeFiliere.has(seance.cours) || seance.cours.toLowerCase().includes(req.user.filiere.toLowerCase()));
    }
    if (seancesFiltrees.length === 0) {
      return res.json({ ok: true, message: 'Aucune séance à copier pour cette filière', seancesCrees: 0 });
    }
    const differenceJours = Math.round((new Date(lundiDestination) - new Date(lundiSource)) / (1000 * 60 * 60 * 24));
    const nouvellesSeances = [];
    for (const seanceSource of seancesFiltrees) {
      const nouvelleDateSeance = new Date(seanceSource.dateSeance);
      nouvelleDateSeance.setDate(nouvelleDateSeance.getDate() + differenceJours);
      const coursDoc = await Cours.findOne({ nom: seanceSource.cours });
      const coursNom = coursDoc ? coursDoc.nom : seanceSource.cours;
      const coursId = coursDoc ? coursDoc._id : seanceSource.coursId;
      const seanceExistante = await Seance.findOne({
        cours: coursNom,
        dateSeance: nouvelleDateSeance,
        heureDebut: seanceSource.heureDebut,
        heureFin: seanceSource.heureFin,
        typeSeance: { $in: ['reelle', 'exception'] }
      });
      if (seanceExistante) continue;
      const nouvelleSeance = new Seance({
        cours: coursNom,
        coursId: coursId,
        professeur: seanceSource.professeur._id || seanceSource.professeur,
        matiere: seanceSource.matiere,
        salle: seanceSource.salle,
        dateSeance: nouvelleDateSeance,
        jour: seanceSource.jour,
        heureDebut: seanceSource.heureDebut,
        heureFin: seanceSource.heureFin,
        typeSeance: 'exception',
        actif: true,
        creeParPedagogique: req.user.id,
        notes: `Copié depuis ${seanceSource.dateSeance.toISOString().split('T')[0]} par ${req.user.nom}`,
        ...getActorFromReq(req, 'creation')
      });
      await nouvelleSeance.save({ validateBeforeSave: true });
      nouvellesSeances.push(nouvelleSeance);
    }
    res.json({ ok: true, message: `${nouvellesSeances.length} séances copiées avec succès`, seancesCrees: nouvellesSeances.length, filiere: req.user.filiere });
  } catch (error) {
    console.error('Erreur copie semaine pédagogique:', error);
    res.status(500).json({
      ok: false,
      error: 'Erreur lors de la copie',
      details: error.message
    });
  }
});
app.post('/api/pedagogique/seances/copier-semaine-precedente', authPedagogique, async (req, res) => {
  try {
    const { lundiDestination } = req.body;
    if (!lundiDestination) {
      return res.status(400).json({ ok: false, error: 'Date de destination obligatoire' });
    }
    const dateDestination = new Date(lundiDestination);
    const lundiSource = new Date(dateDestination);
    lundiSource.setDate(lundiSource.getDate() - 7);
    let coursFilter = {};
    if (req.user.role !== 'pedagogique_general' && req.user.role !== 'admin') {
      const coursFiliere = await Cours.find({ filiere: req.user.filiere }).select('nom');
      const nomsCoursFiliere = coursFiliere.map(c => c.nom);
      coursFilter = { cours: { $in: nomsCoursFiliere } };
    }
    const dimancheSource = new Date(lundiSource);
    dimancheSource.setDate(dimancheSource.getDate() + 6);
    dimancheSource.setHours(23, 59, 59, 999);
    const seancesSource = await Seance.find({
      ...coursFilter,
      typeSeance: { $in: ['reelle', 'exception'] },
      dateSeance: { $gte: lundiSource, $lte: dimancheSource },
      actif: true
    });
    if (seancesSource.length === 0) {
      return res.json({ ok: true, message: 'Aucune séance à copier pour la semaine précédente dans votre filière', seancesCrees: 0 });
    }
    const nouvellesSeances = [];
    for (const seanceSource of seancesSource) {
      const nouvelleDateSeance = new Date(seanceSource.dateSeance);
      nouvelleDateSeance.setDate(nouvelleDateSeance.getDate() + 7);
      const coursDoc = await Cours.findOne({ nom: seanceSource.cours });
      const coursNom = coursDoc ? coursDoc.nom : seanceSource.cours;
      const coursId = coursDoc ? coursDoc._id : seanceSource.coursId;
      const existe = await Seance.findOne({
        cours: coursNom,
        dateSeance: nouvelleDateSeance,
        heureDebut: seanceSource.heureDebut,
        heureFin: seanceSource.heureFin
      });
      if (existe) continue;
      const nouvelleSeance = new Seance({
        cours: coursNom,
        coursId: coursId,
        professeur: seanceSource.professeur,
        matiere: seanceSource.matiere,
        salle: seanceSource.salle,
        dateSeance: nouvelleDateSeance,
        jour: seanceSource.jour,
        heureDebut: seanceSource.heureDebut,
        heureFin: seanceSource.heureFin,
        typeSeance: 'exception',
        actif: true,
        creePar: req.user._id,
        dateCreation: new Date(),
        ...getActorFromReq(req, 'creation')
      });
      await nouvelleSeance.save({ validateBeforeSave: true });
      nouvellesSeances.push(nouvelleSeance);
    }
    res.json({ ok: true, message: `${nouvellesSeances.length} séances copiées depuis la semaine précédente`, seancesCrees: nouvellesSeances.length });
  } catch (error) {
    console.error('Erreur copie semaine précédente:', error);
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});