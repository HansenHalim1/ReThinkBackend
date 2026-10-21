import Foundation

struct TranscriptCue: Codable {
    let startSeconds: Double
    let endSeconds: Double
    let text: String
}

struct ConceptVideo: Decodable, Identifiable {
    let id: String
    let version: Int
    let topicId: String
    let skillIds: [String]
    let title: String
    let summary: String
    let language: String
    let durationSeconds: Double
    let renderer: String
    let hasAudio: Bool
    let width: Int
    let height: Int
    let mimeType: String
    let videoUrl: URL
    let posterUrl: URL
    let captionsUrl: URL
    let transcript: [TranscriptCue]
}

struct VideoCatalog: Decodable {
    let schemaVersion: Int
    let catalogVersion: String
    let videos: [ConceptVideo]
}

struct ReThinkProfile: Decodable {
    let id: UUID
    let email: String?
    let displayName: String
    let createdAt: String?
}

struct VideoHelpRequest: Encodable {
    let videoId: String
    let videoVersion: Int
    let cueIndex: Int
    let question: String
}

struct VideoHelpResponse: Decodable {
    let videoId: String
    let videoVersion: Int
    let cueIndex: Int
    let explanation: String
    let source: String
    let model: String?
    let reason: String?
}

struct FoundationQuestion: Decodable {
    struct Option: Decodable { let id: String; let text: String }
    let id: String
    let topicId: String
    let topicTitle: String
    let difficulty: Int
    let prompt: String
    let options: [Option]
}

struct FoundationTopicResult: Decodable {
    let id: String
    let title: String
    let correct: Int
    let total: Int
    let suggestedKnown: Bool
    let checked: Bool
}

struct FoundationAssessment: Decodable {
    let schemaVersion: Int
    let bankVersion: String
    let revision: Int
    let status: String
    let answered: Int
    let total: Int
    let topicCount: Int
    let checklistSaved: Bool
    let question: FoundationQuestion?
    let topics: [FoundationTopicResult]

    func validated() throws -> FoundationAssessment {
        guard schemaVersion == 1, revision >= 0, total > 0, total <= 100,
              answered >= 0, answered <= total, topicCount > 0,
              ["not-started", "in-progress", "complete"].contains(status) else {
            throw ReThinkAPIError.invalidResponse
        }
        if status == "complete" {
            guard answered == total, question == nil, topics.count == topicCount,
                  Set(topics.map(\.id)).count == topicCount,
                  topics.allSatisfy({ $0.total > 0 && $0.correct >= 0 && $0.correct <= $0.total }) else {
                throw ReThinkAPIError.invalidResponse
            }
        } else {
            guard answered < total, (status == "not-started") == (answered == 0), topics.isEmpty,
                  let question, (1...3).contains(question.difficulty), question.options.count == 4,
                  Set(question.options.map(\.id)).count == 4 else {
                throw ReThinkAPIError.invalidResponse
            }
        }
        return self
    }
}

private struct FoundationAnswerCommand: Encodable {
    let action = "answer"
    let questionId: String
    let optionId: String
    let expectedRevision: Int
}
private struct FoundationReviewCommand: Encodable {
    let action = "review"
    let knownTopicIds: [String]
    let expectedRevision: Int
}

struct CurriculumCatalog: Decodable {
    struct Track: Decodable { let id: String; let title: String; let description: String }
    let curriculumVersion: String
    let tracks: [Track]
    let unlocked: Bool
    let modules: [CurriculumLesson]
    let progress: [CurriculumModuleProgress]
}
struct CurriculumLesson: Decodable, Identifiable {
    struct Example: Decodable { let problem: String; let steps: [String] }
    struct Option: Decodable { let id: String; let text: String }
    struct Quiz: Decodable { let prompt: String; let options: [Option] }
    struct Alignment: Decodable {
        let sourceUrl: URL?
        let section: String
        let kind: String
        let verification: String
        let pdfPages: [Int]?
    }
    let id: String
    let grade: Int
    let title: String
    let summary: String
    let duration: String
    let track: String
    let phase: String
    let gradePlacement: String
    let contentVersion: String
    let prerequisites: [String]
    let bankTopicIds: [String]
    let reviewStatus: String
    let alignment: Alignment
    let objectives: [String]
    let explanation: [String]
    let formulas: [String]
    let example: Example
    let additionalExamples: [Example]
    let commonMistakes: [String]
    let quiz: Quiz
}
struct CurriculumModuleProgress: Decodable {
    let moduleId: String
    let completed: Bool
    let attempts: Int
    let revision: Int
}
struct CurriculumAnswerReply: Decodable {
    let correct: Bool
    let explanation: String
    let progress: CurriculumModuleProgress
}
private struct CurriculumAnswerCommand: Encodable {
    let moduleId: String
    let answerId: String
    let expectedRevision: Int
}

struct VisualizationCatalog: Decodable {
    let schemaVersion: Int
    let catalogVersion: String
    let visualizations: [ConceptVisualization]
}
struct ConceptVisualization: Decodable, Identifiable {
    struct Parameter: Decodable {
        let label: String
        let min: Double
        let max: Double
        let step: Double
        let initial: Double
    }
    struct Stage: Decodable {
        let index: Int
        let value: Double
        let caption: String
        let result: String
        let svgUrl: URL
    }
    let id: String
    let version: Int
    let topicId: String
    let title: String
    let question: String
    let takeaway: String
    let interaction: String
    let width: Int
    let height: Int
    let parameter: Parameter
    let stages: [Stage]
}


// Catalog nil cueIndex means whole transcript. YouTube nil focuses on current playback when provided.
struct StudyChatMessage: Encodable {
    let role: String // user or assistant only
    let content: String
}

enum StudyChatContext: Encodable {
    case catalog(video: ConceptVideo, cueIndex: Int?)
    case youtube(id: String, title: String, transcript: [TranscriptCue], cueIndex: Int? = nil, playbackSeconds: Double? = nil, transcriptScope: String = "full")
    private enum Keys: String, CodingKey { case kind, id, version, cueIndex, title, transcript, playbackSeconds, transcriptScope }
    func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: Keys.self)
        switch self {
        case let .catalog(video, cueIndex):
            try c.encode("catalog", forKey: .kind)
            try c.encode(video.id, forKey: .id)
            try c.encode(video.version, forKey: .version)
            if let cueIndex { try c.encode(cueIndex, forKey: .cueIndex) }
            else { try c.encodeNil(forKey: .cueIndex) }
        case let .youtube(id, title, transcript, cueIndex, playbackSeconds, transcriptScope):
            try c.encode("youtube", forKey: .kind)
            try c.encode(id, forKey: .id)
            try c.encode(title, forKey: .title)
            try c.encode(transcript, forKey: .transcript)
            if let cueIndex { try c.encode(cueIndex, forKey: .cueIndex) }
            else { try c.encodeNil(forKey: .cueIndex) }
            try c.encodeIfPresent(playbackSeconds, forKey: .playbackSeconds)
            try c.encode(transcriptScope, forKey: .transcriptScope)
        }
    }
}

private struct StudyChatCommand: Encodable {
    let question: String
    let messages: [StudyChatMessage]
    let context: StudyChatContext?
}
struct StudyChatReply: Decodable {
    let answer: String
    let source: String
    let model: String?
    let reason: String?
}
private struct YouTubeTranscriptCommand: Encodable { let url: String; let language: String }
struct YouTubeTranscript: Decodable {
    let id: String
    let title: String
    let language: String
    let transcriptOrigin: String
    let transcript: [TranscriptCue]
}

private struct ErrorPayload: Decodable { let error: String }

enum ReThinkAPIError: LocalizedError {
    case invalidURL, invalidResponse, unsupportedSchema, authenticationRequired
    case http(Int, String)
    var errorDescription: String? {
        switch self {
        case .invalidURL: return "The backend URL is invalid."
        case .invalidResponse: return "The server returned an invalid response."
        case .unsupportedSchema: return "This video catalog version is unsupported."
        case .authenticationRequired: return "Please sign in again."
        case let .http(_, message): return message
        }
    }
}

@MainActor
final class ReThinkAPI {
    // The provider must get a current Supabase session; forceRefresh is true
    // only when retrying an authenticated read/help request after one 401 response.
    typealias TokenProvider = (_ forceRefresh: Bool) async throws -> String
    private let baseURL: URL
    private let tokenProvider: TokenProvider?
    private let session: URLSession

    init(baseURL: URL, session: URLSession = .shared, tokenProvider: TokenProvider? = nil) {
        self.baseURL = baseURL
        self.session = session
        self.tokenProvider = tokenProvider
    }

    func videos(topicId: String? = nil) async throws -> VideoCatalog {
        let query = topicId.map { [URLQueryItem(name: "topicId", value: $0)] } ?? []
        let catalog: VideoCatalog = try await request(path: "api/videos", query: query, authenticated: false)
        guard catalog.schemaVersion == 1 else { throw ReThinkAPIError.unsupportedSchema }
        return catalog
    }

    func profile() async throws -> ReThinkProfile {
        try await request(path: "api/me", authenticated: true)
    }

    func explain(video: ConceptVideo, cueIndex: Int, question: String) async throws -> VideoHelpResponse {
        let body = try JSONEncoder().encode(VideoHelpRequest(
            videoId: video.id, videoVersion: video.version, cueIndex: cueIndex, question: question
        ))
        let reply: VideoHelpResponse = try await request(path: "api/video-help", authenticated: true, body: body)
        guard reply.videoId == video.id, reply.videoVersion == video.version,
              reply.cueIndex == cueIndex, ["gateway", "curated"].contains(reply.source) else {
            throw ReThinkAPIError.invalidResponse
        }
        return reply
    }

    func foundationAssessment() async throws -> FoundationAssessment {
        let result: FoundationAssessment = try await request(path: "api/assessment", authenticated: true)
        return try result.validated()
    }

    // Pass __unsure to record "Belum tahu". On 409, reload; do not replay automatically.
    func answerFoundationAssessment(_ current: FoundationAssessment, optionId: String) async throws -> FoundationAssessment {
        guard let question = current.question, current.status != "complete",
              optionId == "__unsure" || question.options.contains(where: { $0.id == optionId }) else {
            throw ReThinkAPIError.invalidResponse
        }
        let body = try JSONEncoder().encode(FoundationAnswerCommand(
            questionId: question.id, optionId: optionId, expectedRevision: current.revision
        ))
        let reply: FoundationAssessment = try await request(path: "api/assessment", authenticated: true, body: body)
        let result = try reply.validated()
        guard result.bankVersion == current.bankVersion, result.revision == current.revision + 1,
              result.answered == current.answered + 1 else { throw ReThinkAPIError.invalidResponse }
        return result
    }

    func saveFoundationChecklist(_ current: FoundationAssessment, knownTopicIds: [String]) async throws -> FoundationAssessment {
        guard current.status == "complete", Set(knownTopicIds).count == knownTopicIds.count,
              knownTopicIds.allSatisfy({ id in current.topics.contains(where: { $0.id == id }) }) else {
            throw ReThinkAPIError.invalidResponse
        }
        let body = try JSONEncoder().encode(FoundationReviewCommand(
            knownTopicIds: knownTopicIds, expectedRevision: current.revision
        ))
        let reply: FoundationAssessment = try await request(path: "api/assessment", authenticated: true, body: body)
        let result = try reply.validated()
        guard result.bankVersion == current.bankVersion, result.status == "complete", result.checklistSaved,
              result.revision == current.revision + 1, result.answered == current.answered else {
            throw ReThinkAPIError.invalidResponse
        }
        return result
    }

    func curriculum() async throws -> CurriculumCatalog {
        let catalog: CurriculumCatalog = try await request(path: "api/curriculum", authenticated: true)
        guard !catalog.curriculumVersion.isEmpty,
              Set(catalog.modules.map(\.id)).count == catalog.modules.count,
              catalog.modules.allSatisfy({ [10,11,12].contains($0.grade) && $0.quiz.options.count == 4 }) else {
            throw ReThinkAPIError.invalidResponse
        }
        return catalog
    }

    // Count completion only within the explicitly selected track. Advanced is elective.
    // On 409, reload the catalog/progress and let the student review before retrying.
    func answerCurriculum(_ lesson: CurriculumLesson, optionId: String, expectedRevision: Int) async throws -> CurriculumAnswerReply {
        guard expectedRevision >= 0, lesson.quiz.options.contains(where: { $0.id == optionId }) else {
            throw ReThinkAPIError.invalidResponse
        }
        let body = try JSONEncoder().encode(CurriculumAnswerCommand(
            moduleId: lesson.id, answerId: optionId, expectedRevision: expectedRevision
        ))
        let reply: CurriculumAnswerReply = try await request(path: "api/curriculum", authenticated: true, body: body)
        guard reply.progress.moduleId == lesson.id, reply.progress.revision == expectedRevision + 1 else {
            throw ReThinkAPIError.invalidResponse
        }
        return reply
    }

    // Native clients can select four captioned SVG stages. The web also has a continuous model control.
    func visualizations(topicId: String? = nil) async throws -> VisualizationCatalog {
        let query = topicId.map { [URLQueryItem(name: "topicId", value: $0)] } ?? []
        let catalog: VisualizationCatalog = try await request(path: "api/visualizations", query: query, authenticated: false)
        guard catalog.schemaVersion == 1, Set(catalog.visualizations.map(\.id)).count == catalog.visualizations.count,
              catalog.visualizations.allSatisfy({ visual in
                  visual.version > 0 && visual.interaction == "stage-selector" && visual.width > 0 && visual.height > 0 &&
                  visual.stages.count == 4 && visual.stages.enumerated().allSatisfy({ index, stage in
                      stage.index == index && ["https", "http"].contains(stage.svgUrl.scheme ?? "")
                  })
              }) else { throw ReThinkAPIError.invalidResponse }
        return catalog
    }

    // Hold history/context in view state. Server does not persist chat conversations.
    func chat(question: String, messages: [StudyChatMessage] = [], context: StudyChatContext? = nil) async throws -> StudyChatReply {
        guard !question.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
              question.count <= 1600, messages.count <= 10 else { throw ReThinkAPIError.invalidResponse }
        let body = try JSONEncoder().encode(StudyChatCommand(question: question, messages: messages, context: context))
        let reply: StudyChatReply = try await request(path: "api/chat", authenticated: true, body: body)
        guard ["gateway", "curated"].contains(reply.source), !reply.answer.isEmpty,
              reply.answer.count <= 6000 else { throw ReThinkAPIError.invalidResponse }
        return reply
    }

    func youtubeTranscript(url: URL, language: String = "en") async throws -> YouTubeTranscript {
        guard ["en", "id"].contains(language) else { throw ReThinkAPIError.invalidResponse }
        let body = try JSONEncoder().encode(YouTubeTranscriptCommand(url: url.absoluteString, language: language))
        let reply: YouTubeTranscript = try await request(path: "api/youtube-transcript", authenticated: true, body: body)
        guard reply.language == language, !reply.transcript.isEmpty, reply.transcript.count <= 3000,
              reply.transcript.allSatisfy({ $0.startSeconds.isFinite && $0.endSeconds.isFinite &&
                  $0.startSeconds >= 0 && $0.endSeconds > $0.startSeconds && !$0.text.isEmpty }) else {
            throw ReThinkAPIError.invalidResponse
        }
        return reply
    }

    private func request<T: Decodable>(path: String, query: [URLQueryItem] = [], authenticated: Bool, body: Data? = nil) async throws -> T {
        guard var parts = URLComponents(url: baseURL.appendingPathComponent(path), resolvingAgainstBaseURL: false) else {
            throw ReThinkAPIError.invalidURL
        }
        if !query.isEmpty { parts.queryItems = query }
        guard let url = parts.url else { throw ReThinkAPIError.invalidURL }
        for attempt in 0...1 {
            var request = URLRequest(url: url)
            if let body {
                request.httpMethod = "POST"
                request.httpBody = body
                request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            }
            request.timeoutInterval = 25
            request.cachePolicy = .reloadIgnoringLocalCacheData
            request.setValue("application/json", forHTTPHeaderField: "Accept")
            if authenticated {
                guard let tokenProvider else { throw ReThinkAPIError.authenticationRequired }
                request.setValue("Bearer \(try await tokenProvider(attempt == 1))", forHTTPHeaderField: "Authorization")
            }
            let (data, response) = try await session.data(for: request)
            guard let http = response as? HTTPURLResponse else { throw ReThinkAPIError.invalidResponse }
            if http.statusCode == 401 && authenticated && attempt == 0 { continue }
            guard (200..<300).contains(http.statusCode) else {
                let message = (try? JSONDecoder().decode(ErrorPayload.self, from: data))?.error ?? "Request failed."
                throw ReThinkAPIError.http(http.statusCode, message)
            }
            return try JSONDecoder().decode(T.self, from: data)
        }
        throw ReThinkAPIError.authenticationRequired
    }
}
