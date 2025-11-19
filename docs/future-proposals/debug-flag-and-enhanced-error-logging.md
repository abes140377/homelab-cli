/openspec:proposal Add a debug flag and enhance error logging for better troubleshooting

Introduce a debug flag as described in https://oclif.io/docs/base_class

wenn das flag gesetzt ist, sollten ausführlichere Protokolle und Fehlermeldungen ausgegeben werden.
zum beispiel kann ein try-catch-block in der Proxmox-Repository-Methode hinzugefügt werden, um detailliertere Fehlerinformationen zu protokollieren:

```typescript
// Enhanced error logging for debugging
console.error('Proxmox API error details:', error);
return failure(
  new RepositoryError('Failed to connect to Proxmox API', {
    cause: error instanceof Error ? error : undefined,
    context: {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    },
  }),
);
```
führe die implemetierung in einer repository methode aus. provoziere einen fehler mit gesetztem debug flag und prüfe ob die ausgabe den fehler-stack anzeigt.
wenn die ausgabe das gewünschte ergebnis zeigt erweitere alle anderen repository methoden.
