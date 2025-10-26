# Architektur-Optimierung: Homelab CLI

## 🏗️ Ursprüngliche Anforderungen

- **Service Layer**: Business-Logik von Commands trennen
- **Repository Pattern**: Datenzugriff abstrahieren
- **Constructor-based Dependency Injection**: Explizite Dependencies ohne DI-Container
- **Minimale Dependencies**: Nur essenzielle npm packages
- **Robustes Error Handling**: Custom Error-Klassen mit proper error codes

---

## 📋 Architektur-Entscheidungen (Final)

### ✅ Bestätigte Entscheidungen:

#### 1. **Service Layer**
**Sehr gut!** Trennt Business-Logik von CLI-Befehlen. Commands werden dünn und fokussiert auf:
- Input-Validierung
- Aufruf von Services
- Output-Formatierung

#### 2. **Repository Pattern**
**Hervorragend!** Abstrahiert Datenzugriff. Macht die Anwendung testbar und flexibel:
- Einfacher Wechsel zwischen Datenquellen (API, Dateisystem, Datenbank)
- Mock-Repositories für Tests
- Zentrale Stelle für Daten-Logik

#### 3. **Constructor-based Dependency Injection**
**Richtig!** Ohne zusätzliche DI-Container. In TypeScript einfach umsetzbar:
- Explizite Abhängigkeiten
- Testbar durch Konstruktor-Parameter
- Kein Magic, keine Decorators notwendig

#### 4. **Minimale Dependencies**
**Ausgezeichnet!** oclif bringt bereits viel mit. Nur eine zusätzliche Dependency:
- ✅ **`zod`** - Für Runtime Validation und Type Inference

#### 5. **Robustes Error Handling**
**Essential!** Custom Error-Klassen mit proper error codes und messages.

#### 6. **Result Pattern** ✨ (Neue Entscheidung)
**Gewählt!** Statt reiner Exception-basierter Fehlerbehandlung:
- ✅ Explizite Fehlerbehandlung
- ✅ Type-safe error handling
- ✅ Functional programming style
- ✅ Zwingt Consumer zur Fehlerbehandlung
- Verwendung in Service- und Repository-Layer
- Commands konvertieren Results zu Exceptions für oclif Error-Handling

**Implementierung:**
```typescript
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E }

// Helper functions
function success<T>(data: T): Result<T, never>
function failure<E>(error: E): Result<never, E>
```

#### 7. **Zod für Validation** ✨ (Neue Entscheidung)
**Gewählt!** Für Runtime Validation:
- ✅ Type inference - Types aus Schemas ableiten
- ✅ Runtime validation - Sichere Datenvalidierung
- ✅ Lightweight (~8kb)
- ✅ Hervorragende DX mit TypeScript
- ✅ Compose-bare schemas
- Verwendung für: DTOs, Config, API responses, User input

**Dependencies: Nur `zod` wird hinzugefügt!**

#### 8. **Custom Error Hierarchy** ✨
**Essentiell!** Strukturierte Fehlerbehandlung mit Context:
```
BaseError (extends Error)
├── ValidationError (Zod validation failures)
├── RepositoryError (data access errors)
├── ServiceError (business logic errors)
└── ExternalAPIError (external service errors)
```
- Jeder Error-Typ trägt spezifischen Context
- Integration mit Result-Pattern
- Serialisierbar für Logging

#### 9. **Factory Pattern für Services** ✨
**Zentrale Dependency-Verwaltung:**
- Service Factory die Dependencies zusammenbaut
- Commands bekommen fertige Service-Instanzen
- Zentrale Initialisierung
- Async factory methods für async initialization
- Singleton-Pattern für teure Resources

#### 10. **DTOs (Data Transfer Objects)** ✨
**Zod-basierte Datenstrukturen:**
- **Zod Schemas** als Source of Truth
- Type-safe Datenstrukturen zwischen Layern
- Inferred Types: `type GreetingDTO = z.infer<typeof GreetingSchema>`
- Transformation Repository → Service → Command
- Runtime Validation an Layer-Grenzen

#### 11. **Result Type Pattern + Zod Integration** ✨
**Explizites Error-Handling mit Type-Safety:**

Services und Repositories geben `Result<T, E>` zurück:
```typescript
class GreetingService {
  async getGreeting(name: string): Promise<Result<GreetingDTO, ServiceError>> {
    // Validate input with Zod
    const validation = NameSchema.safeParse(name);
    if (!validation.success) {
      return failure(new ValidationError(validation.error));
    }

    // Business logic
    const result = await this.repository.find(validation.data);
    if (!result.success) {
      return failure(new ServiceError('Failed to get greeting'));
    }

    return success(result.data);
  }
}
```

---

## 🎯 Weitere Architektur-Verbesserungen

### 1. **Configuration Management**
- Zentrale Config-Klasse mit Umgebungsvariablen
- **Validation mit Zod beim Start**
- Type-safe configuration
- Environment-specific overrides

### 2. **Logger Abstraction**
- Wrapper um `this.log()` von oclif
- Strukturiertes Logging (optional JSON für Produktion)
- Log-Level Support (debug, info, warn, error)
- Context-aware logging

---

## 📁 Finale Ordnerstruktur

```
homelab-cli/src/
├── commands/           # Thin CLI layer (handles Result → Exception conversion)
│   └── hello/
│       ├── index.ts
│       └── world.ts
├── services/           # Business logic (returns Result<T, E>)
│   ├── hello.service.ts
│   └── index.ts
├── repositories/       # Data access (returns Result<T, E>)
│   ├── greeting.repository.ts
│   ├── interfaces/
│   │   └── greeting.repository.interface.ts
│   └── index.ts
├── models/             # Domain models & DTOs (Zod schemas)
│   ├── greeting.model.ts
│   ├── schemas/
│   │   └── greeting.schema.ts
│   └── index.ts
├── errors/             # Custom error classes
│   ├── base.error.ts
│   ├── validation.error.ts
│   ├── repository.error.ts
│   ├── service.error.ts
│   └── index.ts
├── config/             # Configuration (Zod validated)
│   ├── config.ts
│   ├── config.schema.ts
│   └── index.ts
├── factories/          # Service/Repository factories
│   ├── service.factory.ts
│   └── index.ts
├── utils/              # Helpers
│   ├── logger.ts
│   ├── result.ts       # Result type + helper functions
│   └── index.ts
└── index.ts
```

---

## 🎯 Entscheidungsmatrix

| Aspekt | Entscheidung | Begründung |
|--------|--------------|------------|
| **Validation** | ✅ Zod | Runtime safety + Type inference + DX |
| **Error Handling** | ✅ Result Pattern | Type-safe, explicit, functional |
| **DI** | ✅ Constructor Injection | Simple, testable, no magic |
| **Repository Contract** | ✅ Interfaces | Lightweight, TypeScript-native |
| **Async Init** | ✅ Async Factory Methods | Proper async resource handling |
| **Testing** | ✅ Mock Repositories + Factories | Isolated unit tests |

---

## 🔄 Data Flow

```
User Input
    ↓
Command (validates with Zod, handles flags/args)
    ↓
Service Factory (creates service with dependencies)
    ↓
Service (business logic, returns Result<T, E>)
    ↓
Repository (data access, returns Result<T, E>)
    ↓
Result handling in Command
    ↓
Success: Format output with this.log()
Error: Throw oclif-compatible error
```

---

## 🚀 Implementierungsreihenfolge

1. ✅ **Result Type & Helpers** (`utils/result.ts`)
2. ✅ **Error Hierarchy** (`errors/*.ts`)
3. ✅ **Zod Schemas** (`models/schemas/*.ts`)
4. ✅ **Repository Interfaces** (`repositories/interfaces/*.ts`)
5. ✅ **Repository Implementations** (returns Result)
6. ✅ **Services** (uses repositories, returns Result)
7. ✅ **Service Factory** (`factories/service.factory.ts`)
8. ✅ **Config with Zod** (`config/*.ts`)
9. ✅ **Refactor Commands** (use factory, handle Results)
10. ✅ **Unit Tests** (mock repositories)

---

## 🧪 Testing Strategy

### Unit Tests (Services)
```typescript
describe('HelloService', () => {
  it('should return success result for valid greeting', async () => {
    const mockRepo = createMockGreetingRepository();
    const service = new HelloService(mockRepo);

    const result = await service.getGreeting('World');

    expect(result.success).to.be.true;
    if (result.success) {
      expect(result.data.message).to.contain('World');
    }
  });

  it('should return failure result for invalid input', async () => {
    const service = new HelloService(mockRepo);

    const result = await service.getGreeting(''); // Invalid

    expect(result.success).to.be.false;
    if (!result.success) {
      expect(result.error).to.be.instanceOf(ValidationError);
    }
  });
});
```

### Integration Tests (Commands)
```typescript
describe('hello command', () => {
  it('should output greeting message', async () => {
    const {stdout} = await runCommand('hello World --from CLI');
    expect(stdout).to.contain('hello World from CLI');
  });

  it('should handle validation errors', async () => {
    try {
      await runCommand('hello --from CLI'); // Missing required arg
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error.message).to.contain('required');
    }
  });
});
```

---

## 💡 Vorteile dieser Architektur

### 1. **Testbarkeit**
- Services testbar mit Mock-Repositories
- Result-Pattern macht Fehlerszenarien explizit testbar
- Zod-Schemas sind selbst testbar

### 2. **Type Safety**
- Zod inferiert Types aus Schemas
- Result-Pattern erzwingt Fehlerbehandlung
- TypeScript prüft alle Layer

### 3. **Wartbarkeit**
- Klare Trennung der Verantwortlichkeiten
- Einfach neue Commands hinzuzufügen
- Repositories austauschbar

### 4. **Fehlerbehandlung**
- Explizite Fehler mit Result-Pattern
- Custom Error-Klassen mit Context
- Zod gibt detaillierte Validation-Errors

### 5. **Minimale Dependencies**
- Nur Zod zusätzlich zu oclif
- Keine komplexen DI-Frameworks
- Kein ORM oder DB-Library notwendig

---

## 📝 Nächste Schritte

1. **Zod installieren**: `pnpm add zod`
2. **Basis-Utilities implementieren**: Result, Errors
3. **Beispiel-Implementation**: `hello` Command refactoren
4. **Tests schreiben**: Unit + Integration
5. **Dokumentation**: Pattern-Dokumentation für weitere Commands
