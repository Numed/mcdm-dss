export type FormulaId =
  | 'benefit'
  | 'cost'
  | 'decision'
  | 'relation'
  | 'powerMean'
  | 'weights'
  | 'weighted'
  | 'alternativesRelation'
  | 'scores'
  | 'goalNormalization'
  | 'security'
  | 'spread'
  | 'distance'
  | 'closeness'
  | 'z'
  | 'zStar'
  | 'best'

export type FormulaDef = {
  number: string
  tex: string
}

export const FORMULAS: Record<FormulaId, FormulaDef> = {
  benefit: { number: '2.1', tex: String.raw`\mu_{ji} = \frac{x_{ji}}{\max\limits_{k} x_{jk}}` },
  cost: { number: '2.2', tex: String.raw`\mu_{ji} = \frac{\min\limits_{k} x_{jk}}{x_{ji}}` },
  decision: { number: '2.3', tex: String.raw`A = \left(\mu_{ji}\right)_{m \times n}, \quad j = \overline{1, m}, \; i = \overline{1, n}` },
  relation: { number: '2.4', tex: String.raw`NA = \frac{1}{n}\, A \cdot A^{\mathsf T}` },
  powerMean: {
    number: '2.5',
    tex: String.raw`p_j = \left( \frac{1}{m} \sum_{k=1}^{m} na_{jk}^{\,t} \right)^{1/t}, \quad t \in \{-1, 0, 1, 2\}`,
  },
  weights: { number: '2.6', tex: String.raw`w_j = \frac{p_j}{\sum_{k=1}^{m} p_k}` },
  weighted: { number: '2.7', tex: String.raw`B = W \circ A, \quad b_{ji} = w_j \, \mu_{ji}` },
  alternativesRelation: { number: '2.8', tex: String.raw`C = A^{\mathsf T} \cdot B` },
  scores: { number: '2.9', tex: String.raw`r_i = \frac{\sum_{k=1}^{n} c_{ki}}{\sum_{k=1}^{n} \sum_{l=1}^{n} c_{kl}}` },
  goalNormalization: { number: '2.10', tex: String.raw`g_i = \frac{r_i}{\max\limits_{k} r_k}` },
  security: {
    number: '2.11',
    tex: String.raw`B(x_i) = B_s, \quad \min_{l} g_{il} \in \left[ 0{,}2\,(s - 1);\; 0{,}2\,s \right), \; s = \overline{1, 5}`,
  },
  spread: {
    number: '2.12',
    tex: String.raw`m = \arg\max \left\{ \left\| T - x_{\min} \right\|, \; \left\| x_{\max} - T \right\| \right\}`,
  },
  distance: { number: '2.13', tex: String.raw`n_i = \left| T - x_i \right|` },
  closeness: { number: '2.14', tex: String.raw`\mu_{il} = \min\left( m_l, \; n_{il} \right)` },
  z: { number: '2.15', tex: String.raw`z_{il} = 1 - \mu_{il}` },
  zStar: { number: '2.16', tex: String.raw`Z^*_i = \sum_{l=1}^{L} z_{il} \, t_l` },
  best: { number: '2.17', tex: String.raw`X^* = \arg\max_{x_i} Z^*_i` },
}

export const SOURCE_REFERENCE =
  'Polishchuk V. Technology to Improve the Safety of Choosing Alternatives by Groups of Goals // Journal of Automation and Information Sciences. 2019. Vol. 51, Issue 9. P. 66-76.'
