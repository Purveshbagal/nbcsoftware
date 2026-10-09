# UI refresh

Web and Android share a navy (#122B40), teal (#087F82), mint (#72DDD0), and cool neutral (#F4F7FA) palette. Shared themes apply to forms, cards, tables, dialogs and navigation. Login and dashboard have dedicated layouts.

## Checks

- Web: `npm run build`, `npx eslint src eslint.config.mjs`.
- Android: from `mobile`, run `flutter analyze lib test` and `flutter test --concurrency=1`.
- Login widget tests cover required fields, password visibility, and a 320px screen with 2x text scaling.
- Browser checks cover desktop, 390px and 320px widths, password visibility and a mocked invalid-login response. These do not verify live authentication or database workflows.

## Production configuration still required

The Android configuration currently signs release builds with the debug key. Configure the organization's release keystore before distributing a release. Do not commit keystore passwords.

The mobile API can now be set at build time:

```sh
flutter build appbundle --release --dart-define=API_BASE_URL=https://work.nbcpedia.com/api
```

The default API is https://work.nbcpedia.com/api. Use API_BASE_URL only to override it for development or staging. The debug APK is for testing and is not a production release.

Verify registration, approval, payment and sign-out workflows with real admin/field accounts against the intended backend before deployment. The manual API smoke test is skipped unless explicitly enabled with a live backend.
