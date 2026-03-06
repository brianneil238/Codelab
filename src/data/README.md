# Address data for signup & profile

The app loads address options from the **public** folder at runtime so you can update the list without rebuilding.

1. **Put your Philippines address JSON in the project’s `public` folder** and name it **`addresses.json`** (so the app can load it from `/addresses.json`). You can replace or rename; the app expects the file at that URL.

2. **Supported formats** (any of these work):

   **Option A – object with an `addresses` array:**
   ```json
   {
     "addresses": [
       "Manila",
       "Quezon City",
       "Barangay 1, Cebu City"
     ]
   }
   ```

   **Option B – root-level array of strings:**
   ```json
   [
     "Manila",
     "Quezon City",
     "Barangay 1, Cebu City"
   ]
   ```

   **Option C – array of objects** (each with `name` or `label`):
   ```json
   {
     "addresses": [
       { "name": "Manila" },
       { "label": "Quezon City" }
     ]
   }
   ```

3. Save the file. The address field in **Sign up** and **Profile** will suggest these options while still allowing typing.
