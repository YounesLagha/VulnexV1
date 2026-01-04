# VULNEX - MÉTHODOLOGIE D'ANALYSE V2

**Version:** 2.0
**Dernière mise à jour:** 16 décembre 2025

---

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [HTTPS Priority](#https-priority)
3. [Suivi des redirections](#suivi-des-redirections)
4. [États des headers](#états-des-headers)
5. [Analyse détaillée par header](#analyse-détaillée-par-header)
6. [Système de scoring](#système-de-scoring)
7. [Transparence et traçabilité](#transparence-et-traçabilité)
8. [Limitations connues](#limitations-connues)

---

## Vue d'ensemble

Vulnex analyse la sécurité des applications web en évaluant 12 headers HTTP de sécurité critiques. L'analyse suit une méthodologie rigoureuse garantissant des résultats précis et traçables.

### Principes fondamentaux

1. **HTTPS Priority** - Privilégie automatiquement HTTPS si disponible
2. **Suivi des redirections** - Analyse toujours la réponse finale
3. **Transparence totale** - Chaque point du score est expliqué
4. **Analyse progressive** - Récompense les configurations partielles

---

## HTTPS Priority

### Fonctionnement

Lorsqu'un utilisateur fournit une URL en `http://`, Vulnex tente **automatiquement** un upgrade vers `https://` avant d'effectuer le scan.

```
URL fournie: http://example.com
           ↓
Test HTTPS: https://example.com
           ↓
   ┌────────────┴────────────┐
   │                         │
SUCCÈS                   ÉCHEC
   │                         │
   ↓                         ↓
Scan HTTPS            Scan HTTP (fallback)
```

### Critères de décision

- **HTTPS accepté** si le serveur répond avec un code `2xx` ou `3xx`
- **HTTPS rejeté** si timeout, erreur SSL, ou code `4xx/5xx`
- **Traçabilité** : La raison de l'upgrade (ou non) est loggée et retournée

### Exemple de métadonnées

```json
{
  "scanMetadata": {
    "originalUrl": "http://example.com",
    "scannedUrl": "https://example.com",
    "httpsUpgraded": true,
    "upgradeReason": "HTTPS available (status 200)"
  }
}
```

---

## Suivi des redirections

### Configuration

Vulnex suit **automatiquement** les redirections HTTP avec une limite de **5 redirections maximum**.

```typescript
// Configuration axios
maxRedirects: 5
```

### Codes suivis

- **301** - Moved Permanently
- **302** - Found (Temporary Redirect)
- **307** - Temporary Redirect
- **308** - Permanent Redirect

### Garanties

✅ **La réponse finale est TOUJOURS analysée**, pas la réponse intermédiaire
✅ **L'URL finale** est capturée et loggée
✅ **Le nombre de redirections** est tracé dans les logs

### Exemple de cas

```
Requête: http://example.com
  ↓ 301 → https://example.com
  ↓ 301 → https://www.example.com
  ↓ 200 → OK

URL analysée: https://www.example.com (finale)
Headers analysés: Ceux de la réponse 200 finale
```

---

## États des headers

### Les 3 états possibles

Chaque header de sécurité peut se trouver dans **exactement un** de ces 3 états :

#### 1. MISSING (Manquant)

- Le header n'est **pas présent** dans la réponse HTTP
- **Points gagnés :** `0 / max`
- **Recommandation :** "Ajouter le header X"

```json
{
  "Content-Security-Policy": {
    "present": false,
    "secure": false,
    "weight": 10,
    "recommendation": "Ajouter le header Content-Security-Policy"
  }
}
```

#### 2. PRESENT_SECURE (Présent et sécurisé)

- Le header **est présent** ET **correctement configuré**
- **Points gagnés :** `100%` du poids du header
- **Recommandation :** Optionnelle (suggestions d'amélioration possibles)

```json
{
  "Strict-Transport-Security": {
    "present": true,
    "value": "max-age=31536000; includeSubDomains",
    "secure": true,
    "weight": 8,
    "recommendation": null
  }
}
```

#### 3. PRESENT_INSECURE (Présent mais non sécurisé)

- Le header **est présent** MAIS **mal configuré**
- **Points gagnés :** `50%` du poids du header (points partiels)
- **Recommandation :** "CSP non sécurisé: unsafe-inline détecté"

```json
{
  "Content-Security-Policy": {
    "present": true,
    "value": "default-src 'self' 'unsafe-inline'",
    "secure": false,
    "weight": 10,
    "recommendation": "CSP non sécurisé: unsafe-inline détecté"
  }
}
```

### Cas spécial : PENALTY

Pour les headers **Server** et **X-Powered-By**, la logique est **inversée** :

- **Présent** = PÉNALITÉ de points (fuite d'information)
- **Absent** = BONUS de points (bonne pratique)

---

## Analyse détaillée par header

### 1. Content-Security-Policy (10 points)

**Critères de sécurité :**

- ❌ **INSECURE** si contient `unsafe-inline` ou `unsafe-eval`
- ❌ **INSECURE** si wildcard `*` trop permissif (ex: `default-src *`)
- ❌ **INSECURE** si `default-src` est manquant
- ❌ **INSECURE** si politique trop courte (< 30 caractères)
- ✅ **SECURE** si aucun de ces problèmes

**Exemple d'analyse :**

```javascript
// INSECURE
"default-src 'self' 'unsafe-inline'"
→ "CSP non sécurisé: unsafe-inline détecté"

// SECURE
"default-src 'self'; script-src 'self' https://cdn.example.com"
→ Aucune recommandation
```

---

### 2. Strict-Transport-Security (8 points)

**Critères de sécurité :**

- ❌ **INSECURE** si `max-age < 31536000` (1 an)
- ⚠️ **SECURE** (avec suggestion) si `includeSubDomains` manquant
- ✅ **SECURE** si `max-age ≥ 31536000` et `includeSubDomains`

**Exemple d'analyse :**

```javascript
// INSECURE
"max-age=3600"
→ "Augmenter max-age à au moins 31536000 (actuellement 3600)"

// SECURE (avec suggestion)
"max-age=31536000"
→ "Considérer l'ajout de includeSubDomains"

// SECURE (optimal)
"max-age=31536000; includeSubDomains; preload"
→ Aucune recommandation
```

---

### 3. Set-Cookie (15 points)

**Scoring progressif :**

Le cookie est analysé sur 3 attributs :

1. **Secure** (obligatoire en HTTPS)
2. **HttpOnly** (protection XSS)
3. **SameSite** (protection CSRF)

**Règle de sécurité :**

- **SECURE** si au moins **2/3 attributs** présents
- **INSECURE** si moins de 2 attributs

**Bonus :** Vulnex détecte aussi la **qualité** de SameSite :

- `SameSite=Strict` → Optimal
- `SameSite=Lax` → Bon (suggestion d'amélioration)
- `SameSite=None` → Faible sécurité (avertissement)

**Exemples :**

```javascript
// INSECURE (1/3)
"sessionId=abc123; Secure"
→ "Cookie non sécurisé: HttpOnly manquant, SameSite manquant"

// SECURE (2/3)
"sessionId=abc123; Secure; HttpOnly"
→ "Amélioration possible: SameSite manquant"

// SECURE (3/3)
"sessionId=abc123; Secure; HttpOnly; SameSite=Strict"
→ Aucune recommandation
```

---

### 4. X-Frame-Options (7 points)

**Critères de sécurité :**

- ✅ **SECURE** si valeur = `DENY` ou `SAMEORIGIN`
- ❌ **INSECURE** pour toute autre valeur

---

### 5. X-Content-Type-Options (5 points)

**Critères de sécurité :**

- ✅ **SECURE** si valeur = `nosniff`
- ❌ **INSECURE** pour toute autre valeur

---

### 6. Referrer-Policy (3 points)

**Critères de sécurité :**

Valeurs sécurisées :

- `no-referrer`
- `strict-origin`
- `strict-origin-when-cross-origin`
- `same-origin`

Toute autre valeur = **INSECURE**

---

### 7. Permissions-Policy (3 points)

**Critères de sécurité :**

- ✅ **SECURE** si présent (quelle que soit la valeur)

---

### 8-10. Cross-Origin Headers (3 points chacun)

**Cross-Origin-Opener-Policy :**

- ✅ **SECURE** si `same-origin` ou `same-origin-allow-popups`

**Cross-Origin-Embedder-Policy :**

- ✅ **SECURE** si `require-corp`

**Cross-Origin-Resource-Policy :**

- ✅ **SECURE** si `same-origin`, `same-site` ou `cross-origin`

---

### 11-12. Headers de pénalité

#### Server (-2 points)

- **Présent** = Pénalité de 2 points
- **Absent** = Bonus de 2 points

#### X-Powered-By (-2 points)

- **Présent** = Pénalité de 2 points
- **Absent** = Bonus de 2 points

---

## Système de scoring

### Grille de points (sur 64)

| Catégorie                    | Points | Headers                                                                 |
| ---------------------------- | ------ | ----------------------------------------------------------------------- |
| **Headers critiques**        | 45     | CSP (10), HSTS (8), X-Frame (7), X-Content (5), Set-Cookie (15)        |
| **Vie privée & Permissions** | 6      | Referrer-Policy (3), Permissions-Policy (3)                             |
| **Cross-Origin**             | 9      | COOP (3), COEP (3), CORP (3)                                            |
| **Fuite d'information**      | 4      | Server (2), X-Powered-By (2)                                            |
| **TOTAL**                    | **64** | **12 headers**                                                          |

### Calcul du score

#### Étape 1 : Score brut (sur 64)

Pour chaque header :

```javascript
if (header === 'Server' || header === 'X-Powered-By') {
    // Pénalité
    if (present) {
        score -= weight; // Exemple: -2 points
    } else {
        score += weight; // Exemple: +2 points
    }
} else {
    // Headers normaux
    if (MISSING) {
        score += 0;
    } else if (PRESENT_SECURE) {
        score += weight; // 100% des points
    } else if (PRESENT_INSECURE) {
        score += weight * 0.5; // 50% des points
    }
}
```

#### Étape 2 : Normalisation (sur 100)

```javascript
normalizedScore = Math.round((rawScore / 64) * 100);
```

### Exemple de breakdown

```json
{
  "scoreBreakdown": {
    "rawScore": 42,
    "maxScore": 64,
    "normalizedScore": 66,
    "details": [
      {
        "headerName": "Content-Security-Policy",
        "status": "PRESENT_INSECURE",
        "pointsEarned": 5,
        "maxPoints": 10,
        "explanation": "Header présent mais non sécurisé → +5/10 points (50%)"
      },
      {
        "headerName": "Strict-Transport-Security",
        "status": "PRESENT_SECURE",
        "pointsEarned": 8,
        "maxPoints": 8,
        "explanation": "Header sécurisé → +8 points"
      },
      {
        "headerName": "X-Frame-Options",
        "status": "MISSING",
        "pointsEarned": 0,
        "maxPoints": 7,
        "explanation": "Header manquant → 0/7 points"
      },
      {
        "headerName": "Server",
        "status": "PENALTY",
        "pointsEarned": -2,
        "maxPoints": 2,
        "explanation": "Header présent → Pénalité de 2 points (fuite d'information)"
      }
    ]
  }
}
```

---

## Transparence et traçabilité

### Métadonnées de scan

Chaque scan retourne des métadonnées complètes :

```json
{
  "scanMetadata": {
    "originalUrl": "http://example.com",          // URL fournie par l'utilisateur
    "scannedUrl": "https://www.example.com",      // URL finale analysée
    "httpsUpgraded": true,                        // HTTP → HTTPS upgrade effectué
    "upgradeReason": "HTTPS available (status 200)" // Raison de l'upgrade
  },
  "scoreBreakdown": {
    "rawScore": 42,                               // Score brut sur 64
    "maxScore": 64,                               // Score maximum
    "normalizedScore": 66,                        // Score normalisé sur 100
    "details": [/* ... */]                        // Détail de chaque header
  }
}
```

### Logs serveur

Toutes les étapes sont loggées côté serveur :

```
[INFO] Début du scan des headers pour: http://example.com
[INFO] URL upgradée vers HTTPS: http://example.com → https://example.com { reason: 'HTTPS available (status 200)' }
[INFO] Redirections suivies: https://example.com → https://www.example.com { statusCode: 200, redirectCount: 1 }
[INFO] Scan des headers terminé { originalUrl: 'http://example.com', finalUrl: 'https://www.example.com', httpsUpgraded: true, rawScore: 42, normalizedScore: 66 }
```

---

## Limitations connues

### 1. Type de requête HTTP

- **Utilisé :** `GET` (pas `HEAD`)
- **Raison :** Certains serveurs ne retournent pas tous les headers de sécurité sur `HEAD`
- **Impact :** Légère augmentation de la bande passante consommée

### 2. Headers multiples

- Si un header apparaît **plusieurs fois**, seule la **première valeur** est analysée
- Exemple : Plusieurs `Set-Cookie` → Seul le premier est analysé

### 3. Headers dynamiques

- Analyse **statique** : Vulnex ne détecte pas les headers ajoutés dynamiquement en JavaScript
- Exemple : CSP ajouté via `<meta>` tag n'est **pas détecté**

### 4. Contexte applicatif

- Vulnex analyse les **headers HTTP bruts** sans contexte métier
- Certaines configurations "non sécurisées" peuvent être **intentionnelles** selon le cas d'usage

### 5. Certificats SSL

- La **validité du certificat SSL** n'est **pas analysée** (module SSL désactivé en V1)
- Seule la **disponibilité HTTPS** est testée

---

## Différences vs SecurityHeaders.com

| Aspect                      | Vulnex V2                        | SecurityHeaders.com              |
| --------------------------- | -------------------------------- | -------------------------------- |
| **HTTPS Priority**          | ✅ Upgrade automatique            | ❌ Non (scan l'URL fournie)       |
| **Redirections**            | ✅ Suit automatiquement (max 5)   | ✅ Suit automatiquement           |
| **Scoring progressif**      | ✅ 50% de points si header partiel | ❌ Tout ou rien                    |
| **Transparence du scoring** | ✅ Détail complet de chaque point | ⚠️ Partielle                      |
| **Analyse CSP avancée**     | ✅ Détecte wildcards permissifs   | ✅ Oui (plus exhaustive)          |
| **Certificats SSL**         | ❌ Non analysés                   | ✅ Analysés                       |
| **Métadonnées de scan**     | ✅ URL originale/finale tracées   | ❌ Non                            |

---

## Changelog V2

### Nouveautés

✅ **HTTPS Priority** - Upgrade automatique HTTP → HTTPS
✅ **Traçabilité redirections** - URL originale et finale loggées
✅ **3 états explicites** - MISSING / PRESENT_SECURE / PRESENT_INSECURE
✅ **Analyse CSP améliorée** - Détection wildcards permissifs
✅ **Scoring cookies progressif** - 2/3 attributs = sécurisé
✅ **Transparence totale** - scoreBreakdown avec explication de chaque point
✅ **Documentation complète** - Méthodologie V2 détaillée

### Corrections

🔧 Suivi des redirections confirmé (maxRedirects: 5)
🔧 Points partiels pour headers présents mais mal configurés
🔧 Logs enrichis avec raison de chaque décision

---

**Vulnex V2** - Scan de sécurité avec transparence totale
