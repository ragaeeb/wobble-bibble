import { css, html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import {
    extractTranslationIds,
    fixAll,
    fixCollapsedSpeakerLines,
    formatExcerptsForPrompt,
    getMasterPrompt,
    getPrompt,
    getPromptIds,
    getPrompts,
    getStackedPrompt,
    MARKER_ID_PATTERN,
    Markers,
    normalizeTranslationText,
    normalizeTranslationTextWithMap,
    type PromptId,
    parseTranslations,
    parseTranslationsInOrder,
    type Segment,
    stackPrompts,
    TRANSLATION_MARKER_PARTS,
    VALIDATION_ERROR_TYPE_INFO,
    validateTranslationResponse,
} from 'wobble-bibble';
import rootPackageJson from '../../package.json';
import demoPackageJson from '../package.json';

type DemoTab = 'prompts' | 'validation' | 'fixers' | 'utils' | 'constants';

const promptIds = getPromptIds();
const allPrompts = getPrompts();
const libraryName = rootPackageJson.name;
const demoDependencies = demoPackageJson.dependencies as Record<string, string>;
const dependencyVersion = demoDependencies[libraryName].replaceAll('^', '');

const demoSegments: Segment[] = [
    {
        id: 'P256151',
        text: 'السائل: هل يجوز هذا؟\\nالشيخ: لا، هذا لا يجوز.',
    },
    {
        id: 'P256152',
        text: 'هذا نص عربي طويل يحتوي على محتوى كاف للترجمة وهو يمثل فقرة كاملة لاختبار توافق الطول بين النص العربي والترجمة الإنجليزية.',
    },
    {
        id: 'P256153',
        text: 'قال الشيخ: من التزم السنة نجا.',
    },
];

const promptSeed = 'Translate the following segments with strict ID integrity.';

const rawNormalizationInput = [
    'Intro line P256151 - Questioner: Is this allowed? The Shaykh: No, this is not allowed.',
    'P256152 - This line has a literal escape: One\\[two].',
    'P256153 - He advised al-hajr fi al-madajīʿ without a gloss.',
].join('\\r\\n');

const rawValidationResponse = [
    'P256151 - Questioner: Is this allowed? The Shaykh: No, this is not allowed.',
    'P256152 - Brief.',
    'P256153 - The ruling is خروج (exit) from that path.',
    'P999999 - This ID does not exist in source segments.',
].join('\\n');

@customElement('wobble-demo-app')
export class WobbleDemoApp extends LitElement {
    @state()
    private activeTab: DemoTab = 'prompts';

    @state()
    private selectedPromptId: PromptId = promptIds[0] ?? 'master_prompt';

    @state()
    private customAddon =
        'STYLE OVERRIDE: Keep one speaker turn per line.\\nTERM LOCK: Keep isnād (chain) and ḥadīth (report).';

    @state()
    private utilsInput = rawNormalizationInput;

    @state()
    private validationInput = rawValidationResponse;

    @state()
    private fixInput =
        'P256151 - Questioner: Is this allowed? The Shaykh: No. Questioner: Is there proof? The Shaykh: Yes.';

    private readonly tabs: Array<{ id: DemoTab; label: string }> = [
        { id: 'prompts', label: 'Prompt APIs' },
        { id: 'validation', label: 'Validation APIs' },
        { id: 'fixers', label: 'Fixers APIs' },
        { id: 'utils', label: 'Text Utils APIs' },
        { id: 'constants', label: 'Constants' },
    ];

    private selectTab = (tab: DemoTab) => {
        this.activeTab = tab;
    };

    private updatePrompt = (event: Event) => {
        this.selectedPromptId = (event.target as HTMLSelectElement).value as PromptId;
    };

    private updateAddon = (event: Event) => {
        this.customAddon = (event.target as HTMLTextAreaElement).value;
    };

    private updateUtilsInput = (event: Event) => {
        this.utilsInput = (event.target as HTMLTextAreaElement).value;
    };

    private updateValidationInput = (event: Event) => {
        this.validationInput = (event.target as HTMLTextAreaElement).value;
    };

    private updateFixInput = (event: Event) => {
        this.fixInput = (event.target as HTMLTextAreaElement).value;
    };

    private clip = (value: string, maxLength = 850) => {
        if (value.length <= maxLength) {
            return value;
        }
        return `${value.slice(0, maxLength)}\\n... [truncated for readability]`;
    };

    private getPromptDemo = () => {
        const prompt = getPrompt(this.selectedPromptId);
        return {
            combinedPreview: this.clip(prompt.content),
            masterOnlyPreview: this.clip(getMasterPrompt(), 420),
            selectedPrompt: prompt,
            stackedCustomPreview: this.clip(stackPrompts(getMasterPrompt(), this.customAddon), 420),
            stackedOnlyPreview: this.clip(getStackedPrompt(this.selectedPromptId), 420),
        };
    };

    private getUtilsDemo = () => {
        const normalized = normalizeTranslationText(this.utilsInput);
        const withMap = normalizeTranslationTextWithMap(this.utilsInput);
        const parsed = parseTranslations(this.utilsInput);
        const ordered = parseTranslationsInOrder(this.utilsInput);
        return {
            excerptPacket: formatExcerptsForPrompt(demoSegments, promptSeed),
            ids: extractTranslationIds(normalized),
            indexMapPreview: withMap.indexMap.slice(0, 50),
            normalized,
            ordered,
            parsedEntries: [...parsed.translationMap.entries()],
            parsedSize: parsed.count,
        };
    };

    private getValidationDemo = () => {
        return validateTranslationResponse(demoSegments, this.validationInput, {
            config: { allCapsWordRunThreshold: 4 },
        });
    };

    private getFixDemo = () => {
        const targeted = fixCollapsedSpeakerLines(this.fixInput, {
            speakerLabels: ['Questioner', 'The Shaykh'],
        });
        const all = fixAll(this.fixInput, {
            config: { speakerLabels: ['Questioner', 'The Shaykh'] },
            types: ['collapsed_speakers', 'arabic_leak'],
        });

        return { all, targeted };
    };

    private renderPromptPanel = () => {
        const demo = this.getPromptDemo();

        return html`
            <section class="panel">
                <h2>Prompt Functions</h2>
                <p>
                    Functions demonstrated: <code>getPromptIds</code>, <code>getPrompts</code>,
                    <code>getPrompt</code>, <code>getStackedPrompt</code>, <code>getMasterPrompt</code>,
                    <code>stackPrompts</code>.
                </p>

                <label for="prompt-select">Prompt ID</label>
                <select id="prompt-select" @change=${this.updatePrompt} .value=${this.selectedPromptId}>
                    ${repeat(
                        promptIds,
                        (id) => id,
                        (id) => html`<option value=${id}>${id}</option>`,
                    )}
                </select>

                <div class="meta-grid">
                    <article>
                        <h3>Selected Prompt Metadata</h3>
                        <pre>${JSON.stringify(
                            {
                                contentLength: demo.selectedPrompt.content.length,
                                id: demo.selectedPrompt.id,
                                isMaster: demo.selectedPrompt.isMaster,
                                name: demo.selectedPrompt.name,
                            },
                            null,
                            2,
                        )}</pre>
                    </article>
                    <article>
                        <h3>All Prompt IDs</h3>
                        <pre>${JSON.stringify(promptIds, null, 2)}</pre>
                    </article>
                    <article>
                        <h3>All Prompt Records Count</h3>
                        <pre>${JSON.stringify(
                            {
                                count: allPrompts.length,
                                names: allPrompts.map((p) => p.name),
                            },
                            null,
                            2,
                        )}</pre>
                    </article>
                </div>

                <label for="custom-addon">Custom Add-on (for <code>stackPrompts</code>)</label>
                <textarea id="custom-addon" @input=${this.updateAddon}>${this.customAddon}</textarea>

                <h3>getPrompt / getStackedPrompt Preview</h3>
                <pre>${demo.combinedPreview}</pre>

                <h3>getMasterPrompt Preview</h3>
                <pre>${demo.masterOnlyPreview}</pre>

                <h3>stackPrompts(getMasterPrompt(), customAddon)</h3>
                <pre>${demo.stackedCustomPreview}</pre>

                <h3>getStackedPrompt(selectedId)</h3>
                <pre>${demo.stackedOnlyPreview}</pre>
            </section>
        `;
    };

    private renderValidationPanel = () => {
        const result = this.getValidationDemo();

        return html`
            <section class="panel">
                <h2>Validation Functions</h2>
                <p>
                    Functions demonstrated: <code>validateTranslationResponse</code>,
                    <code>VALIDATION_ERROR_TYPE_INFO</code>.
                </p>

                <h3>Source Segments</h3>
                <pre>${JSON.stringify(demoSegments, null, 2)}</pre>

                <label for="validation-input">Model Output</label>
                <textarea id="validation-input" @input=${this.updateValidationInput}>${this.validationInput}</textarea>

                <div class="meta-grid">
                    <article>
                        <h3>Parsed IDs</h3>
                        <pre>${JSON.stringify(result.parsedIds, null, 2)}</pre>
                    </article>
                    <article>
                        <h3>Error Count</h3>
                        <pre>${JSON.stringify({ count: result.errors.length }, null, 2)}</pre>
                    </article>
                </div>

                <h3>Normalized Response</h3>
                <pre>${result.normalizedResponse}</pre>

                <h3>Errors</h3>
                ${
                    result.errors.length === 0
                        ? html`<p class="ok">No validation errors.</p>`
                        : html`
                          ${repeat(
                              result.errors,
                              (error, index) => `${error.type}-${index}-${error.range.start}`,
                              (error) => {
                                  const info = VALIDATION_ERROR_TYPE_INFO[error.type]?.description ?? 'No description';
                                  return html`
                                      <article class="error-card">
                                          <header>
                                              <strong>${error.type}</strong>
                                              <span>${error.range.start}-${error.range.end}</span>
                                          </header>
                                          <p><strong>ID:</strong> ${error.id ?? 'N/A'}</p>
                                          <p><strong>Match:</strong> <code>${error.matchText}</code></p>
                                          <p><strong>Rule:</strong> ${info}</p>
                                          <p><strong>Message:</strong> ${error.message}</p>
                                      </article>
                                  `;
                              },
                          )}
                      `
                }
            </section>
        `;
    };

    private renderFixersPanel = () => {
        const fixDemo = this.getFixDemo();

        return html`
            <section class="panel">
                <h2>Fixer Functions</h2>
                <p>
                    Functions demonstrated: <code>fixCollapsedSpeakerLines</code>, <code>fixAll</code>.
                </p>

                <label for="fix-input">Input Text</label>
                <textarea id="fix-input" @input=${this.updateFixInput}>${this.fixInput}</textarea>

                <h3>fixCollapsedSpeakerLines</h3>
                <pre>${JSON.stringify(fixDemo.targeted, null, 2)}</pre>

                <h3>fixAll(types: ['collapsed_speakers', 'arabic_leak'])</h3>
                <pre>${JSON.stringify(fixDemo.all, null, 2)}</pre>
            </section>
        `;
    };

    private renderUtilsPanel = () => {
        const utils = this.getUtilsDemo();

        return html`
            <section class="panel">
                <h2>Text Utility Functions</h2>
                <p>
                    Functions demonstrated: <code>formatExcerptsForPrompt</code>,
                    <code>normalizeTranslationText</code>, <code>normalizeTranslationTextWithMap</code>,
                    <code>extractTranslationIds</code>, <code>parseTranslations</code>,
                    <code>parseTranslationsInOrder</code>.
                </p>

                <h3>formatExcerptsForPrompt</h3>
                <pre>${utils.excerptPacket}</pre>

                <label for="utils-input">Normalization + Parse Input</label>
                <textarea id="utils-input" @input=${this.updateUtilsInput}>${this.utilsInput}</textarea>

                <h3>normalizeTranslationText</h3>
                <pre>${utils.normalized}</pre>

                <div class="meta-grid">
                    <article>
                        <h3>extractTranslationIds</h3>
                        <pre>${JSON.stringify(utils.ids, null, 2)}</pre>
                    </article>
                    <article>
                        <h3>normalizeTranslationTextWithMap (first 50)</h3>
                        <pre>${JSON.stringify(utils.indexMapPreview, null, 2)}</pre>
                    </article>
                    <article>
                        <h3>parseTranslations Count</h3>
                        <pre>${JSON.stringify({ count: utils.parsedSize }, null, 2)}</pre>
                    </article>
                </div>

                <h3>parseTranslations (Map entries)</h3>
                <pre>${JSON.stringify(utils.parsedEntries, null, 2)}</pre>

                <h3>parseTranslationsInOrder</h3>
                <pre>${JSON.stringify(utils.ordered, null, 2)}</pre>
            </section>
        `;
    };

    private renderConstantsPanel = () => {
        const markerValues = Object.values(Markers);

        return html`
            <section class="panel">
                <h2>Constants / Enums</h2>
                <p>
                    Exports demonstrated: <code>Markers</code>, <code>MARKER_ID_PATTERN</code>,
                    <code>TRANSLATION_MARKER_PARTS</code>.
                </p>

                <div class="meta-grid">
                    <article>
                        <h3>Markers</h3>
                        <pre>${JSON.stringify(markerValues, null, 2)}</pre>
                    </article>
                    <article>
                        <h3>MARKER_ID_PATTERN</h3>
                        <pre>${MARKER_ID_PATTERN}</pre>
                    </article>
                    <article>
                        <h3>TRANSLATION_MARKER_PARTS</h3>
                        <pre>${JSON.stringify(TRANSLATION_MARKER_PARTS, null, 2)}</pre>
                    </article>
                </div>
            </section>
        `;
    };

    private renderPanel = () => {
        switch (this.activeTab) {
            case 'prompts':
                return this.renderPromptPanel();
            case 'validation':
                return this.renderValidationPanel();
            case 'fixers':
                return this.renderFixersPanel();
            case 'utils':
                return this.renderUtilsPanel();
            case 'constants':
                return this.renderConstantsPanel();
            default:
                return this.renderPromptPanel();
        }
    };

    render() {
        return html`
            <main>
                <header>
                    <h1>${libraryName} Interactive Demo</h1>
                    <p>
                        A Lit-based playground for every exported runtime API in <code>${libraryName}</code>
                        using dependency <code>${libraryName}@${dependencyVersion}</code>.
                        Switch tabs to inspect prompt stacking, validation diagnostics, fixers, text parsing,
                        and constants.
                    </p>
                </header>

                <nav>
                    ${repeat(
                        this.tabs,
                        (tab) => tab.id,
                        (tab) => html`
                            <button
                                class=${this.activeTab === tab.id ? 'tab active' : 'tab'}
                                @click=${() => this.selectTab(tab.id)}
                                type="button"
                            >
                                ${tab.label}
                            </button>
                        `,
                    )}
                </nav>

                ${this.renderPanel()}
            </main>
        `;
    }

    static styles = css`
        :host {
            --bg: #f6f7fb;
            --card: #ffffff;
            --text: #1d2433;
            --muted: #55627a;
            --line: #d5dbea;
            --brand: #0056d6;
            display: block;
            color: var(--text);
        }

        main {
            margin: 0 auto;
            max-width: 1200px;
            padding: 24px;
        }

        header h1 {
            font-size: clamp(1.5rem, 1.2rem + 1.2vw, 2.1rem);
            margin: 0 0 0.5rem;
        }

        header p {
            color: var(--muted);
            margin: 0 0 1rem;
            max-width: 78ch;
        }

        nav {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin: 0 0 16px;
        }

        .tab {
            border: 1px solid var(--line);
            background: var(--card);
            border-radius: 10px;
            padding: 10px 14px;
            color: var(--text);
            cursor: pointer;
            font-weight: 600;
        }

        .tab.active {
            border-color: var(--brand);
            background: color-mix(in srgb, var(--brand) 12%, white);
        }

        .panel {
            background: var(--card);
            border: 1px solid var(--line);
            border-radius: 14px;
            padding: 16px;
        }

        h2 {
            margin: 0 0 8px;
        }

        h3 {
            margin: 16px 0 8px;
            font-size: 1rem;
        }

        p {
            margin: 0 0 10px;
        }

        .meta-grid {
            display: grid;
            gap: 12px;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            margin: 12px 0;
        }

        .meta-grid article {
            border: 1px solid var(--line);
            border-radius: 10px;
            padding: 10px;
            background: #f9fbff;
        }

        label {
            display: block;
            font-weight: 600;
            margin: 10px 0 6px;
        }

        select,
        textarea {
            width: 100%;
            border: 1px solid var(--line);
            border-radius: 10px;
            font: inherit;
            padding: 10px;
            box-sizing: border-box;
            background: #fff;
            color: inherit;
        }

        textarea {
            min-height: 120px;
            resize: vertical;
        }

        pre {
            margin: 0;
            padding: 10px;
            border: 1px solid var(--line);
            background: #0f17261a;
            border-radius: 10px;
            overflow: auto;
            white-space: pre-wrap;
            word-break: break-word;
            font-size: 0.86rem;
            line-height: 1.35;
        }

        .error-card {
            border: 1px solid #f3c4c4;
            border-radius: 10px;
            background: #fff8f8;
            padding: 10px;
            margin: 8px 0;
        }

        .error-card header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 6px;
        }

        .ok {
            color: #0d6e3b;
            font-weight: 600;
        }

        code {
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
            background: #edf2ff;
            padding: 1px 5px;
            border-radius: 4px;
        }

        @media (max-width: 640px) {
            main {
                padding: 14px;
            }

            .tab {
                width: 100%;
                text-align: left;
            }
        }
    `;
}

declare global {
    interface HTMLElementTagNameMap {
        'wobble-demo-app': WobbleDemoApp;
    }
}
