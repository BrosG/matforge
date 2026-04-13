import { FaqItem } from "./index";

const faqs: FaqItem[] = [
  {
    slug: "what-is-dft",
    question: "What is density functional theory (DFT)?",
    answer: `Density functional theory (DFT) is a quantum mechanical method for computing the electronic structure and total energy of materials from first principles -- meaning it uses only the laws of quantum mechanics and the atomic numbers of the elements, without empirical fitting parameters.

## How It Works

DFT maps the many-electron problem onto an effective single-electron problem by using the electron density as the fundamental variable (rather than the many-body wavefunction). The Kohn-Sham equations are solved self-consistently to find the ground-state electron density and total energy.

## What DFT Can Predict

- Crystal structure and lattice parameters
- Formation energies and thermodynamic stability
- Electronic band structure and band gaps
- Elastic constants and mechanical properties
- Phonon spectra and thermal properties
- Magnetic ordering and moments

## Limitations

- Band gaps are underestimated by standard functionals (GGA/PBE) by 30-50%
- Strongly correlated systems (f-electron materials, Mott insulators) are poorly described
- Van der Waals interactions require special functionals
- Calculations are performed at 0 K and may miss temperature-dependent effects`,
    category: "methodology",
    order: 0,
    relatedSlugs: ["what-is-pbe", "what-is-hubbard-u"],
    tags: ["dft", "theory", "quantum", "methodology"],
  },
  {
    slug: "what-is-pbe",
    question: "What is the PBE functional and why is it used?",
    answer: `PBE (Perdew-Burke-Ernzerhof) is a generalized gradient approximation (GGA) exchange-correlation functional -- the most widely used functional in solid-state DFT calculations.

## Why PBE Is Popular

- **No empirical parameters**: Constructed entirely from exact constraints on the exchange-correlation energy
- **Good balance**: Provides reasonable accuracy for structures, energies, and elastic properties across diverse chemistries
- **Computational cost**: Much cheaper than hybrid functionals (HSE06) or many-body methods (GW), allowing calculations on thousands of materials
- **Consistency**: All three major databases (MP, AFLOW, JARVIS) use PBE-based workflows, enabling fair comparisons

## Known Limitations

- Systematically underestimates band gaps by 30-50%
- Overbinds d-electron and f-electron systems without Hubbard U corrections
- Poorly captures van der Waals interactions (layered materials, molecular crystals)
- Self-interaction error can delocalize electrons in strongly correlated systems

## Alternatives in MatCraft

- **PBE+U**: Used by Materials Project for transition metal oxides
- **OptB88vdW**: Used by JARVIS for better van der Waals description
- **MBJ (modified Becke-Johnson)**: Used by JARVIS for more accurate band gaps
- **HSE06**: Hybrid functional giving better band gaps, but too expensive for high-throughput`,
    category: "methodology",
    order: 1,
    relatedSlugs: ["what-is-dft", "what-is-hubbard-u"],
    tags: ["pbe", "functional", "gga", "methodology"],
  },
  {
    slug: "what-is-hubbard-u",
    question: "What is Hubbard U correction (DFT+U)?",
    answer: `The Hubbard U correction (DFT+U or GGA+U) adds an on-site Coulomb interaction term to specific atomic orbitals (usually transition metal d or rare earth f orbitals) to correct for the self-interaction error in standard DFT.

## Why It Is Needed

Standard GGA/PBE functionals tend to over-delocalize d and f electrons, leading to:
- Incorrect ground states for transition metal oxides
- Wrong magnetic ordering
- Metallic predictions for known insulators (e.g., FeO, NiO)

## How It Works

A Hubbard U parameter (typically 2-6 eV) is added to penalize fractional occupation of the targeted orbitals. This favors integer occupation and localizes the electrons, improving the description of:
- Transition metal oxides (Fe, Co, Ni, Mn, V, Cr compounds)
- Rare earth compounds
- Materials with strong electron correlation

## Materials Project U Values

Materials Project uses empirically fitted U values for specific elements:
- V: 3.25 eV, Cr: 3.7 eV, Mn: 3.9 eV, Fe: 5.3 eV
- Co: 3.32 eV, Ni: 6.2 eV, Cu: 4.0 eV, Mo: 4.38 eV, W: 6.2 eV

These values were calibrated to reproduce experimental formation enthalpies of binary oxides.

## Implications for Users

When comparing materials containing transition metals across databases, be aware that different U values or no U correction will give different results. Filter by data source for consistent comparisons.`,
    category: "methodology",
    order: 2,
    relatedSlugs: ["what-is-dft", "what-is-pbe"],
    tags: ["hubbard-u", "dft+u", "correction", "transition-metals"],
  },
  {
    slug: "pseudopotential-methods",
    question: "What are pseudopotentials and PAW?",
    answer: `Pseudopotentials and the Projector Augmented Wave (PAW) method are techniques for simplifying DFT calculations by replacing the deep core electrons with an effective potential.

## Why Pseudopotentials Are Used

Core electrons (1s, 2s, 2p for heavy elements) are tightly bound and do not participate in chemical bonding. Including them explicitly requires very fine numerical grids and many basis functions, making calculations prohibitively expensive.

## Pseudopotential Approach

A pseudopotential replaces the true all-electron potential near the nucleus with a smoother effective potential that:
1. Reproduces the correct scattering properties for valence electrons
2. Gives the same eigenvalues as the all-electron calculation outside a cutoff radius
3. Allows much lower plane-wave energy cutoffs (300-600 eV vs. thousands of eV)

## PAW Method

The Projector Augmented Wave (PAW) method, used by VASP and other codes, is a more rigorous formalism that:
- Maintains the full all-electron wavefunction information
- Provides better total energies and forces than norm-conserving pseudopotentials
- Is the standard in Materials Project and AFLOW calculations

## Practical Impact

Different pseudopotential libraries can give slightly different property values. This is one reason why the same material may have different computed properties in different databases.`,
    category: "methodology",
    order: 3,
    relatedSlugs: ["what-is-dft", "what-is-pbe"],
    tags: ["pseudopotential", "paw", "core-electrons"],
  },
  {
    slug: "kpoint-convergence",
    question: "What is k-point sampling and why does it matter?",
    answer: `K-point sampling refers to the discrete grid of points in reciprocal space (the Brillouin zone) used to compute integrals over electronic states. The density of this grid directly affects the accuracy and cost of DFT calculations.

## Why K-Points Matter

In a periodic crystal, electronic properties must be averaged over all allowed wavevectors (k-points) in the Brillouin zone. Since there are infinitely many k-points, we approximate by sampling a finite grid:

- **Too few k-points**: Inaccurate total energies, forces, and electronic properties
- **Too many k-points**: Unnecessarily expensive calculations
- **Just right**: Converged results at minimal cost

## Typical Grids

- **Metals**: Need dense grids (8x8x8 or higher for small cells) because of sharp features at the Fermi surface
- **Semiconductors**: Moderate grids (4x4x4 to 6x6x6) usually suffice
- **Large supercells**: Can use sparser grids because the Brillouin zone is smaller

## Band Structure Calculations

Band structure plots use a special k-point path along high-symmetry directions rather than a uniform grid. The path depends on the crystal system.

## Database Consistency

All three databases (MP, AFLOW, JARVIS) use converged k-point grids, but their convergence criteria differ slightly. This can lead to small numerical differences for the same material across databases.`,
    category: "methodology",
    order: 4,
    relatedSlugs: ["what-is-dft", "pseudopotential-methods"],
    tags: ["kpoints", "convergence", "brillouin-zone", "sampling"],
  },
  {
    slug: "convex-hull-method",
    question: "How is the convex hull (phase diagram) constructed?",
    answer: `The convex hull is a geometric construction used to determine thermodynamic phase stability across a composition space.

## Construction Process

1. **Collect formation energies**: Gather the DFT-computed formation energy for every known phase in a chemical system (e.g., all Li-Fe-O compounds)
2. **Plot in composition-energy space**: Each phase is a point with coordinates (composition, formation energy per atom)
3. **Compute the convex hull**: The lower convex envelope of these points defines the set of thermodynamically stable phases
4. **Determine stability**: Phases on the hull are stable; phases above the hull are metastable or unstable

## Energy Above Hull

For any phase not on the hull, the energy above hull (Ehull) is the vertical distance from that phase to the hull at the same composition. This represents the thermodynamic driving force for decomposition.

## Limitations

- The hull is only as complete as the set of known phases. If a stable phase is missing from the database, the hull may be incorrect.
- DFT energies have uncertainties of 0.02-0.05 eV/atom, which can affect stability predictions near the hull.
- Temperature effects (entropy, vibrations) are not included in standard 0 K convex hulls.
- Kinetic barriers to decomposition are not captured.

## In MatCraft

MatCraft computes convex hulls on demand for any chemical system using the full database of known phases. The phase diagram endpoint returns both stable and unstable phases with their hull distances.`,
    category: "methodology",
    order: 5,
    relatedSlugs: ["what-is-dft", "what-is-pbe"],
    tags: ["convex-hull", "phase-diagram", "stability", "thermodynamics"],
  },
  {
    slug: "band-structure-calculation",
    question: "How are band structures computed?",
    answer: `Band structure calculations determine the allowed electron energy levels as a function of crystal momentum (k-vector) along high-symmetry paths in the Brillouin zone.

## Calculation Procedure

1. **Self-consistent calculation**: First, a standard DFT calculation on a uniform k-grid determines the converged charge density and potential
2. **Non-self-consistent calculation**: The converged potential is then used to compute eigenvalues at k-points along the high-symmetry path, without updating the charge density
3. **Plotting**: Eigenvalues are plotted as E(k) curves along the path

## High-Symmetry Paths

The k-point path connects special points in the Brillouin zone. Standard paths are defined for each crystal system:
- **Cubic (FCC)**: Gamma-X-W-K-Gamma-L-U-W-L-K
- **Cubic (BCC)**: Gamma-H-N-Gamma-P-H
- **Hexagonal**: Gamma-M-K-Gamma-A-L-H-A

## Spin-Orbit Coupling

For materials with heavy elements, spin-orbit coupling (SOC) can be included. This splits degenerate bands and can change the band gap significantly (important for Bi, Pb, Sn, Te compounds).

## Accuracy Considerations

- Band dispersions (shapes) are generally reliable from GGA/PBE
- Absolute band gap values are underestimated
- For accurate gaps, HSE06 or GW calculations are needed but not available for all materials in the databases`,
    category: "methodology",
    order: 6,
    relatedSlugs: ["what-is-dft", "dos-calculation"],
    tags: ["band-structure", "electronic", "calculation", "methodology"],
  },
  {
    slug: "dos-calculation",
    question: "How is the density of states (DOS) computed?",
    answer: `The density of states (DOS) counts the number of electronic states per unit energy at each energy level, integrated over the entire Brillouin zone.

## Calculation Procedure

1. Perform a self-consistent DFT calculation with a dense uniform k-point grid
2. Compute eigenvalues at all k-points
3. Histogram the eigenvalues into energy bins
4. Apply Gaussian or Lorentzian broadening to smooth the result

## Types of DOS in MatCraft

- **Total DOS**: Sum of all contributions from all atoms and orbitals
- **Element-projected DOS (PDOS)**: Contribution from each chemical element
- **Orbital-projected DOS**: Contribution from each orbital type (s, p, d, f)
- **Spin-resolved DOS**: For magnetic materials, separate curves for spin-up and spin-down channels

## Broadening

Raw DOS from a finite k-grid has sharp, noisy features. Gaussian smearing (typically 0.05-0.2 eV width) smooths the DOS for visualization. The choice of smearing width affects the apparent sharpness of peaks but not the integrated quantities.

## Practical Uses

- Identifying metallic vs. semiconducting behavior
- Determining orbital character of valence and conduction bands
- Estimating d-band center for catalysis predictions
- Analyzing chemical bonding through orbital overlap`,
    category: "methodology",
    order: 7,
    relatedSlugs: ["band-structure-calculation", "what-is-dft"],
    tags: ["dos", "density-of-states", "electronic", "calculation"],
  },
  {
    slug: "elastic-calculation",
    question: "How are elastic properties computed with DFT?",
    answer: `Elastic properties are computed by applying small strains to the crystal structure and measuring the resulting stress (or energy change).

## Stress-Strain Method

1. Apply a set of small strains (typically 0.5-1%) to the unit cell
2. For each strained structure, relax the internal atomic positions while keeping the cell shape fixed
3. Compute the stress tensor from the DFT calculation
4. Fit the stress-strain relationship to extract the elastic stiffness tensor (Cij)

## Derived Properties

From the full elastic tensor (Cij), several engineering quantities are derived:

- **Bulk modulus (K)**: Voigt-Reuss-Hill average of the bulk modulus
- **Shear modulus (G)**: Voigt-Reuss-Hill average of the shear modulus
- **Young's modulus (E)**: Computed from K and G as E = 9KG/(3K+G)
- **Poisson's ratio (v)**: Computed as v = (3K-2G)/(6K+2G)

## Why Not All Materials Have Elastic Data

Elastic constant calculations require 6-21 separate strained calculations (depending on crystal symmetry), making them significantly more expensive than a standard relaxation. Not all materials in the databases have been processed through this workflow.

## Accuracy

DFT elastic constants typically agree with experiment to within 10-20%. The agreement is best for simple metals and semiconductors and less reliable for strongly correlated or van der Waals bonded materials.`,
    category: "methodology",
    order: 8,
    relatedSlugs: ["what-is-dft", "what-is-pbe"],
    tags: ["elastic", "mechanical", "stress-strain", "calculation"],
  },
  {
    slug: "xrd-simulation-method",
    question: "How are XRD patterns simulated?",
    answer: `X-ray diffraction (XRD) patterns are simulated from the crystal structure using kinematic diffraction theory.

## Simulation Process

1. **Identify reflections**: For a given crystal structure, all allowed Bragg reflections (hkl) within the measured 2-theta range are enumerated based on the lattice parameters
2. **Compute structure factors**: For each (hkl) reflection, the structure factor F(hkl) is calculated from the atomic positions, element-specific scattering factors, and thermal displacement parameters
3. **Apply corrections**: Lorentz-polarization factor, multiplicity factor, and Debye-Waller factor are applied
4. **Generate pattern**: Peak positions (from Bragg's law) and intensities (from |F(hkl)|^2 with corrections) are combined and broadened with a pseudo-Voigt profile

## Default Parameters in MatCraft

- **Radiation**: Cu K-alpha (wavelength = 1.5406 Angstroms)
- **2-theta range**: 10 to 90 degrees
- **Peak broadening**: 0.1 degree FWHM (idealized)

## Uses

- **Phase identification**: Compare simulated patterns with experimental XRD measurements to confirm phase identity
- **Fingerprinting**: Each crystal structure produces a unique diffraction pattern
- **Quality check**: Verify that the computed crystal structure matches known experimental patterns

## Limitations

Simulated patterns assume a perfect, infinite crystal. Real samples have finite size broadening, strain effects, preferred orientation, and background signals that are not modeled.`,
    category: "methodology",
    order: 9,
    relatedSlugs: ["what-is-dft"],
    tags: ["xrd", "diffraction", "simulation", "characterization"],
  },
];

export default faqs;
