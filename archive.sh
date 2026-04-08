#!/bin/bash

# ================================
# Script interattivo per archiviare branch
# ================================
# Usage: ./archive-branch.sh [mode]
# mode: tag (default) | rename
# ================================

REMOTE="tiledesk-server"
MODE="${1:-tag}"   # default mode = tag

PROTECTED_BRANCHES=("master" "master-PRE" "master-COLLAUDO" "master-STAGE")

# Funzione per scegliere un branch valido
get_branch_to_archive() {
  local branch="$1"

  while true; do
    # Se branch protetto, avvisa
    if [[ " ${PROTECTED_BRANCHES[@]} " =~ " ${branch} " ]]; then
      echo "❌ Il branch '$branch' è protetto e non può essere archiviato."
    fi

    # Controlla che il branch locale esista
    if git show-ref --verify --quiet refs/heads/"$branch"; then
      break  # branch valido trovato
    fi

    # Richiedi input all’utente
    read -p "Inserisci un branch locale valido da archiviare (oppure 'quit' per annullare): " branch
    if [[ "$branch" == "quit" || "$branch" == "q" ]]; then
      echo "Operazione annullata."
      exit 0
    fi
  done

  echo "$branch"
}

# Branch corrente
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Se branch corrente non è protetto, chiedi conferma
if [[ ! " ${PROTECTED_BRANCHES[@]} " =~ " ${CURRENT_BRANCH} " ]]; then
  echo "⚡ Branch corrente: $CURRENT_BRANCH"
  read -p "Vuoi archiviare questo branch? (y/n): " CONFIRM
  if [[ "$CONFIRM" != "y" ]]; then
    read -p "Inserisci il branch da archiviare (oppure 'quit' per annullare): " USER_BRANCH
    if [[ "$USER_BRANCH" == "quit" || "$USER_BRANCH" == "q" ]]; then
      echo "Operazione annullata."
      exit 0
    fi
    CURRENT_BRANCH=$(get_branch_to_archive "$USER_BRANCH")
  fi
else
  # Branch corrente è protetto, chiedi un branch alternativo
  CURRENT_BRANCH=$(get_branch_to_archive "$CURRENT_BRANCH")
fi

# Operazione di archiviazione
if [ "$MODE" == "tag" ]; then
  ARCHIVE_TAG="archive/$(echo $CURRENT_BRANCH | tr '/' '-')"
  echo "Creando tag di archivio: $ARCHIVE_TAG"
  git tag "$ARCHIVE_TAG" "$CURRENT_BRANCH"
  git push "$REMOTE" "$ARCHIVE_TAG"

  echo "Eliminando branch remoto $CURRENT_BRANCH"
  git push "$REMOTE" --delete "$CURRENT_BRANCH"

  echo "Eliminando branch locale $CURRENT_BRANCH"
  git branch -d "$CURRENT_BRANCH"

  echo "✅ Branch '$CURRENT_BRANCH' archiviato con tag '$ARCHIVE_TAG'"

elif [ "$MODE" == "rename" ]; then
  ARCHIVE_BRANCH="archive/$CURRENT_BRANCH"
  echo "Rinomino branch locale in: $ARCHIVE_BRANCH"
  git branch -m "$CURRENT_BRANCH" "$ARCHIVE_BRANCH"

  echo "Pusho nuovo branch su remote $REMOTE"
  git push "$REMOTE" "$ARCHIVE_BRANCH"

  echo "Eliminando branch remoto vecchio $CURRENT_BRANCH"
  git push "$REMOTE" --delete "$CURRENT_BRANCH"

  echo "✅ Branch '$CURRENT_BRANCH' archiviato come '$ARCHIVE_BRANCH'"

else
  echo "❌ Modalità non valida. Usa 'tag' o 'rename'."
  exit 1
fi