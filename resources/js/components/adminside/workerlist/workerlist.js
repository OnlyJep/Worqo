import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { message } from "antd";
import AdminSidebar from "./../adminsidebar/adminsidebar";
import TopNavbar from "./../admintopnavbar/admintopnavbar";
import { FaSquare, FaCheckSquare, FaCheckCircle, FaArchive, FaEye, FaCheck, FaTimes } from "react-icons/fa";
import { MdOutlineModeEditOutline } from "react-icons/md";
import { IconSearch, IconPlus, IconArchive } from "@tabler/icons-react";
import "./../../../../sass/components/_workerlist.scss"
import WorkerModal from "./workerlistmodal.js";



import Loader from "./../../LoaderContent/loader";



const formatDate = (dateString) => {

  if (!dateString) return "N/A";

  const date = new Date(dateString);

  if (isNaN(date.getTime())) return "N/A";

  return new Intl.DateTimeFormat("en-US", {

    month: "short",

    day: "2-digit",

    year: "numeric",

    hour: "2-digit",

    minute: "2-digit",

    hour12: true,

  }).format(date);

};



const getFullName = (worker, suffixes = []) => {

  const { first_name, middlename, last_name, suffix_id } = worker?.profile || {};

  if (!first_name && !last_name) return "N/A";

  let fullName = `${first_name || ""}${middlename ? " " + middlename : ""} ${last_name || ""}`;

  if (suffix_id && suffixes.length > 0) {

    const suffix = suffixes.find((s) => s.id === parseInt(suffix_id))?.suffix_name;

    if (suffix) fullName += ` ${suffix}`;

  }

  return fullName.trim() || "Unknown Worker";

};



const WorkerList = () => {

  const [workers, setWorkers] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");

  const [showArchived, setShowArchived] = useState(false);

  const [selectedWorkers, setSelectedWorkers] = useState([]);

  const [activeTab, setActiveTab] = useState("all"); // all | to_review | accepted | declined

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const [workerToArchive, setWorkerToArchive] = useState(null);

  const [workerToReview, setWorkerToReview] = useState(null);

  const [reviewAction, setReviewAction] = useState(null); // 'accept' or 'decline'

  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isEditMode, setIsEditMode] = useState(false);

  const [workerToEdit, setWorkerToEdit] = useState(null);

  const [genders, setGenders] = useState([]);

  const [suffixes, setSuffixes] = useState([]);

  const [skills, setSkills] = useState([]);

  const [error, setError] = useState("");

  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const [previewCredential, setPreviewCredential] = useState(null);

  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();



  useEffect(() => {

    const controller = new AbortController();

    const fetchData = async () => {

      try {

        setLoading(true);

        await Promise.all([

          fetchWorkers(pagination.currentPage, showArchived, controller.signal),

          fetchGenders(controller.signal),

          fetchSuffixes(controller.signal),

          fetchSkills(controller.signal),

        ]);

      } catch (err) {

        if (err.name !== "AbortError") {

          message.error("Failed to fetch data. Check console for details.");

          console.error("Fetch data error:", err);

        }

      } finally {

        if (!controller.signal.aborted) {

          setLoading(false);

        }

      }

    };

    fetchData();

    return () => controller.abort();

  }, [pagination.currentPage, showArchived, searchTerm, activeTab]);



  const fetchWorkers = async (page = 1, archived = false, signal) => {

    try {

      const authToken = localStorage.getItem("auth_token");

      if (!authToken) {

        throw new Error("Please log in to view workers.");

      }

      
      
      const response = await axios.get(`/api/workers${archived ? '/archived' : '/admin'}`, {

        headers: { Authorization: `Bearer ${authToken}`, Accept: "application/json" },

        params: { page, limit: 5, search: searchTerm, status: activeTab },

        signal,

        timeout: 10000,

      });

      
      
      console.log('API Response:', response.data);

      const workersData = Array.isArray(response.data.workers) ? response.data.workers : [];

      
      
      setWorkers(workersData);

      setPagination({

        currentPage: response.data.pagination?.currentPage || 1,

        totalPages: response.data.pagination?.totalPages || 1,

        totalItems: response.data.pagination?.totalItems || 0,

      });

      setError("");

    } catch (err) {

      if (err.name === "AbortError") return;

      const errorMessage = err.response?.data?.error || "Failed to fetch workers.";

      setError(errorMessage);

      message.error(errorMessage);

      console.error("Fetch workers error:", err.response?.data || err.message);

    }

  };



  const fetchGenders = async (signal) => {

    try {

      const authToken = localStorage.getItem("auth_token");

      if (!authToken) {

        throw new Error("No auth token found. Please log in.");

      }

      const response = await axios.get(`/api/genders`, {

        headers: { Authorization: `Bearer ${authToken}`, Accept: "application/json" },

        signal,

        timeout: 15000,

      });

      const gendersData = Array.isArray(response.data) ? response.data : [];

      setGenders(gendersData);

      console.log("Fetched genders:", gendersData);

    } catch (err) {

      if (err.name === "AbortError") return;

      console.error("Error fetching genders:", err.response?.data || err.message);

      message.error("Failed to fetch genders. Please try again.");

    }

  };



  const fetchSuffixes = async (signal) => {

    try {

      const authToken = localStorage.getItem("auth_token");

      if (!authToken) {

        throw new Error("No auth token found. Please log in.");

      }

      const response = await axios.get(`/api/suffixes`, {

        headers: { Authorization: `Bearer ${authToken}`, Accept: "application/json" },

        signal,

        timeout: 15000,

      });

      const suffixesData = Array.isArray(response.data) ? response.data : [];

      setSuffixes(suffixesData);

      console.log("Fetched suffixes:", suffixesData);

    } catch (err) {

      if (err.name === "AbortError") return;

      console.error("Error fetching suffixes:", err.response?.data || err.message);

      message.error("Failed to fetch suffixes. Please try again.");

    }

  };



  const fetchSkills = async (signal) => {

    try {

      const authToken = localStorage.getItem("auth_token");

      if (!authToken) {

        throw new Error("No auth token found. Please log in.");

      }

      const response = await axios.get(`/api/skills`, {

        headers: { Authorization: `Bearer ${authToken}`, Accept: "application/json" },

        signal,

        timeout: 15000,

      });

      const skillsData = Array.isArray(response.data) ? response.data : [];

      setSkills(skillsData);

      console.log("Fetched skills:", skillsData);

    } catch (err) {

      if (err.name === "AbortError") return;

      console.error("Error fetching skills:", err.response?.data || err.message);

      message.error("Failed to fetch skills. Please try again.");

    }

  };



  const toggleSelectWorker = (workerId) => {

    setSelectedWorkers((prev) =>

      prev.includes(workerId)

        ? prev.filter((id) => id !== workerId)

        : [...prev, workerId]

    );

  };



  const toggleSelectAll = () => {

    const currentWorkers = filteredWorkers;

    if (selectedWorkers.length === currentWorkers.length) {

      setSelectedWorkers([]);

    } else {

      setSelectedWorkers(currentWorkers.map((worker) => worker.id));

    }

  };



  const handleTabChange = (newTab) => {

    setActiveTab(newTab);

    setSelectedWorkers([]);

    setPagination({ currentPage: 1, totalPages: 1, totalItems: 0 });

    setError("");

  };



  const handlePageChange = (newPage) => {

    if (newPage >= 1 && newPage <= totalPages) {

      setPagination({ ...pagination, currentPage: newPage });

    }

  };



  const handleToggleArchived = () => {

    setShowArchived((prev) => !prev);

    setPagination({ currentPage: 1, totalPages: 1, totalItems: 0 });

    setSelectedWorkers([]);

    setError("");

  };



  const handleArchiveClick = (worker) => {

    if (worker.archived) {

      message.error("Worker is already archived.");

      return;

    }

    setWorkerToArchive(worker);

    setIsConfirmModalOpen(true);

    setReviewAction(null);

  };



  const handleReviewClick = (worker, action) => {

    const status = getReviewStatus(worker.worker?.is_reviewed);

    if (status === 'ACCEPTED' || status === 'DECLINED') {

      message.error(`Worker is already ${status.toLowerCase()}.`);

      return;

    }

    setWorkerToReview(worker);

    setReviewAction(action);

    setIsConfirmModalOpen(true);

    setWorkerToArchive(null);

  };



  const handleArchiveConfirm = async () => {

    if (!workerToArchive) return;

    try {

      const authToken = localStorage.getItem("auth_token");

      if (!authToken) {

        throw new Error("No auth token found. Please log in.");

      }

      setLoading(true);

      const response = await axios.patch(

        `${window.location.origin}/api/workers/${workerToArchive.id}/archive`,

        { archived: true },

        {

          headers: { Authorization: `Bearer ${authToken}`, Accept: "application/json" },

          timeout: 15000,

        }

      );

      if (response.status === 200) {

        await fetchWorkers(pagination.currentPage, showArchived, new AbortController().signal);

        setIsConfirmModalOpen(false);

        setWorkerToArchive(null);

        message.success(`Worker "${getFullName(workerToArchive, suffixes)}" archived successfully!`);

      }

    } catch (err) {

      if (err.name === "AbortError") return;

      const errorMessage = err.response?.data?.error || "Failed to archive worker.";

      setError(errorMessage);

      message.error(errorMessage);

      console.error("Archive error:", err.response?.data || err.message);

    } finally {

      setLoading(false);

    }

  };



  const handleReviewConfirm = async () => {

    if (!workerToReview || !reviewAction) return;

    try {

      const authToken = localStorage.getItem("auth_token");

      if (!authToken) {

        throw new Error("No auth token found. Please log in.");

      }

      setLoading(true);

      const status = reviewAction === 'accept' ? 'ACCEPTED' : 'DECLINED';

      const response = await axios.patch(

        `${window.location.origin}/api/workers/${workerToReview.id}/review`,

        { is_reviewed: status },

        {

          headers: { Authorization: `Bearer ${authToken}`, Accept: "application/json" },

          timeout: 15000,

        }

      );

      if (response.status === 200) {

        await fetchWorkers(pagination.currentPage, showArchived, new AbortController().signal);

        setIsConfirmModalOpen(false);

        setWorkerToReview(null);

        setReviewAction(null);

        message.success(`Worker "${getFullName(workerToReview, suffixes)}" ${reviewAction}d successfully!`);

      }

    } catch (err) {

      if (err.name === "AbortError") return;

      // Handle specific error cases
      if (err.response?.status === 404) {
        const errorMessage = err.response?.data?.error || 'Worker not found. The worker may have been deleted.';
        message.error(errorMessage);
        
        // Refresh the worker list to remove the deleted worker
        await fetchWorkers(pagination.currentPage, showArchived, new AbortController().signal);
        
        setIsConfirmModalOpen(false);
        setWorkerToReview(null);
        setReviewAction(null);
        return;
      }

      const errorMessage = err.response?.data?.error || `Failed to ${reviewAction} worker.`;

      setError(errorMessage);

      message.error(errorMessage);

      console.error("Review error:", err.response?.data || err.message);

    } finally {

      setLoading(false);

    }

  };



  const handleRestoreWorker = async (workerId) => {

    const worker = workers.find((w) => w.id === workerId);

    if (!worker?.archived) {

      message.error("Worker is already restored.");

      return;

    }

    try {

      const authToken = localStorage.getItem("auth_token");

      if (!authToken) {

        throw new Error("No auth token found. Please log in.");

      }

      setLoading(true);

      const response = await axios.patch(

        `${window.location.origin}/api/workers/${workerId}/archive`,

        { archived: false },

        {

          headers: { Authorization: `Bearer ${authToken}`, Accept: "application/json" },

          timeout: 15000,

        }

      );

      if (response.status === 200) {

        await fetchWorkers(pagination.currentPage, showArchived, new AbortController().signal);

        message.success(`Worker "${getFullName(worker, suffixes)}" restored successfully!`);

      }

    } catch (err) {

      if (err.name === "AbortError") return;

      const errorMessage = err.response?.data?.error || "Failed to restore worker.";

      setError(errorMessage);

      message.error(errorMessage);

      console.error("Restore error:", err.response?.data || err.message);

    } finally {

      setLoading(false);

    }

  };



  const handleBulkAction = async (action) => {

    if (selectedWorkers.length === 0) {

      message.error("Please select at least one worker.");

      return;

    }

    try {

      const authToken = localStorage.getItem("auth_token");

      if (!authToken) {

        throw new Error("No auth token found. Please log in.");

      }

      const validWorkerIds = selectedWorkers.filter((id) => {

        const worker = workers.find((w) => w.id === id);

        return action === "archive" ? !worker?.archived : worker?.archived;

      });

      if (validWorkerIds.length === 0) {

        message.error(`All selected workers are already ${action === "archive" ? "archived" : "restored"}.`);

        return;

      }

      setLoading(true);

      const response = await axios.post(

        `${window.location.origin}/api/workers/bulk-archive`,

        { worker_ids: validWorkerIds, archived: action === "archive" },

        {

          headers: { Authorization: `Bearer ${authToken}`, Accept: "application/json" },

          timeout: 10000,

        }

      );

      if (response.status === 200) {

        await fetchWorkers(pagination.currentPage, showArchived, new AbortController().signal);

        setSelectedWorkers([]);

        message.success(`${validWorkerIds.length} workers ${action === "archive" ? "archived" : "restored"} successfully!`);

      }

    } catch (err) {

      if (err.name === "AbortError") return;

      const errorMessage = err.response?.data?.error || `Failed to ${action} workers. Please try again.`;

      setError(errorMessage);

      message.error(errorMessage);

      console.error("Bulk action error:", err.response?.data || err.message);

    } finally {

      setLoading(false);

    }

  };



  const handleBulkReview = async (action) => {

    if (selectedWorkers.length === 0) {

      message.error("Please select at least one worker.");

      return;

    }

    try {

      const authToken = localStorage.getItem("auth_token");

      if (!authToken) {

        throw new Error("No auth token found. Please log in.");

      }

      const pendingIds = selectedWorkers.filter((id) => {

        const worker = workers.find((w) => w.id === id);

        const status = getReviewStatus(worker?.worker?.is_reviewed);

        return status === 'TO BE REVIEWED';

      });

      if (pendingIds.length === 0) {

        message.error("Selected workers are not pending review.");

        return;

      }

      setLoading(true);

      const status = action === 'accept' ? 'ACCEPTED' : 'DECLINED';

      const response = await axios.post(

        `${window.location.origin}/api/workers/bulk-review`,

        { worker_ids: pendingIds, is_reviewed: status },

        {

          headers: { Authorization: `Bearer ${authToken}`, Accept: "application/json" },

          timeout: 10000,

        }

      );

      if (response.status === 200) {

        await fetchWorkers(pagination.currentPage, showArchived, new AbortController().signal);

        setSelectedWorkers([]);

        message.success(`${pendingIds.length} workers ${action === 'accept' ? 'accepted' : 'declined'} successfully!`);

      }

    } catch (err) {

      if (err.name === "AbortError") return;

      // Handle specific error cases
      if (err.response?.status === 404) {
        const errorMessage = err.response?.data?.error || 'Some workers not found. The workers may have been deleted.';
        message.error(errorMessage);
        
        // Refresh the worker list to remove any deleted workers
        await fetchWorkers(pagination.currentPage, showArchived, new AbortController().signal);
        setSelectedWorkers([]);
        return;
      }

      const errorMessage = err.response?.data?.error || `Failed to ${action} selected workers.`;

      setError(errorMessage);

      message.error(errorMessage);

      console.error("Bulk review error:", err.response?.data || err.message);

    } finally {

      setLoading(false);

    }

  };



  const handleBulkDeleteDeclined = async () => {

    if (selectedWorkers.length === 0) {

      message.error("Please select at least one worker.");

      return;

    }

    try {

      const authToken = localStorage.getItem("auth_token");

      if (!authToken) {

        throw new Error("No auth token found. Please log in.");

      }

      const declinedIds = selectedWorkers.filter((id) => {

        const worker = workers.find((w) => w.id === id);

        const status = getReviewStatus(worker?.worker?.is_reviewed);

        return status === 'DECLINED';

      });

      if (declinedIds.length === 0) {

        message.error("Selected workers are not declined.");

        return;

      }

      setLoading(true);

      const response = await axios.post(

        `${window.location.origin}/api/workers/bulk-delete-declined`,

        { worker_ids: declinedIds },

        {

          headers: { Authorization: `Bearer ${authToken}`, Accept: "application/json" },

          timeout: 15000,

        }

      );

      if (response.status === 200) {

        await fetchWorkers(1, showArchived, new AbortController().signal);

        setPagination({ ...pagination, currentPage: 1 });

        setSelectedWorkers([]);

        message.success(`${declinedIds.length} declined workers deleted successfully!`);

      }

    } catch (err) {

      if (err.name === "AbortError") return;

      const errorMessage = err.response?.data?.error || `Failed to delete selected declined workers.`;

      setError(errorMessage);

      message.error(errorMessage);

      console.error("Bulk delete declined error:", err.response?.data || err.message);

    } finally {

      setLoading(false);

    }

  };



  const handleDeleteArchivedWorker = async (workerId) => {

    try {

      const authToken = localStorage.getItem("auth_token");

      if (!authToken) {

        throw new Error("No auth token found. Please log in.");

      }

      setLoading(true);

      const response = await axios.delete(`/api/workers/${workerId}`, {

        headers: { Authorization: `Bearer ${authToken}`, Accept: "application/json" },

        timeout: 8000,

      });

      if (response.status === 200) {

        await fetchWorkers(pagination.currentPage, showArchived, new AbortController().signal);

        message.success("Archived worker deleted.");

      }

    } catch (err) {

      if (err.name === "AbortError") return;

      const errorMessage = err.response?.data?.error || "Failed to delete worker.";

      setError(errorMessage);

      message.error(errorMessage);

    } finally {

      setLoading(false);

    }

  };



  const handleBulkDeleteArchived = async () => {

    if (selectedWorkers.length === 0) {

      message.error("Please select at least one worker.");

      return;

    }

    try {

      const authToken = localStorage.getItem("auth_token");

      if (!authToken) {

        throw new Error("No auth token found. Please log in.");

      }

      const archivedIds = selectedWorkers.filter((id) => {

        const w = workers.find((x) => x.id === id);

        return w?.archived === 1 || w?.archived === true;

      });

      if (archivedIds.length === 0) {

        message.error("Selected workers are not archived.");

        return;

      }

      setLoading(true);

      const response = await axios.post(

        `${window.location.origin}/api/workers/bulk-delete-archived`,

        { worker_ids: archivedIds },

        {

          headers: { Authorization: `Bearer ${authToken}`, Accept: "application/json" },

          timeout: 15000,

        }

      );

      if (response.status === 200) {

        await fetchWorkers(pagination.currentPage, showArchived, new AbortController().signal);

        setSelectedWorkers([]);

        message.success(`${archivedIds.length} archived workers deleted successfully!`);

      }

    } catch (err) {

      if (err.name === "AbortError") return;

      const errorMessage = err.response?.data?.error || `Failed to delete archived workers.`;

      setError(errorMessage);

      message.error(errorMessage);

    } finally {

      setLoading(false);

    }

  };



  const handleAddNewClick = () => {

    setIsEditMode(false);

    setWorkerToEdit({

      email: "",

      username: "",

      profile: {

        first_name: "",

        middlename: "",

        last_name: "",

        suffix_id: "",

        gender_id: "",

        contact_number: "",

        street: "",

        city: "Butuan City",

        province: "Agusan Del Norte",

        postal_code: "8600",

        country: "Philippines",

        profile_img: null,

        image_url: null,

      },

      worker: {

        skills_id: [],

        credentials_name: [],

        credentials_photo: [],

        is_reviewed: "TO BE REVIEWED",

      },

    });

    setIsModalOpen(true);

    setError("");

  };



  const handleEditClick = async (worker) => {

    try {

      const authToken = localStorage.getItem("auth_token");

      if (!authToken) {

        throw new Error("No auth token found. Please log in.");

      }

      setLoading(true);

      const response = await axios.get(`/api/workers/${worker.id}`, {

        headers: { Authorization: `Bearer ${authToken}`, Accept: "application/json" },

        timeout: 15000,

      });

      setWorkerToEdit({

        id: response.data.id,

        email: response.data.email || "",

        username: response.data.username || "",

        archived: response.data.archived || false,

        created_at: response.data.created_at || null,

        updated_at: response.data.updated_at || null,

        profile_id: response.data.profile_id || null,

        profile: {

          id: response.data.profile?.id || null,

          first_name: response.data.profile?.first_name || "",

          middlename: response.data.profile?.middlename || "",

          last_name: response.data.profile?.last_name || "",

          suffix_id: response.data.profile?.suffix_id ? String(response.data.profile.suffix_id) : "",

          gender_id: response.data.profile?.gender_id ? String(response.data.profile.gender_id) : "",

          contact_number: response.data.profile?.contact_number || "",

          street: response.data.profile?.street || "",

          city: response.data.profile?.city || "Butuan City",

          province: response.data.profile?.province || "Agusan Del Norte",

          postal_code: response.data.profile?.postal_code || "8600",

          country: response.data.profile?.country || "Philippines",

          profile_img: response.data.profile?.profile_img || null,

          image_url: response.data.profile?.profile_img 
            ? `${window.location.origin}/storage/${response.data.profile.profile_img}` 
            : null,

        },

        worker: {

          hours_per_day: response.data.worker?.hours_per_day || 4,

          preferred_working_hours: response.data.worker?.preferred_working_hours || [],

          preferred_working_days: response.data.worker?.preferred_working_days || [],

          bio: response.data.worker?.bio || "",

          skills_id: response.data.worker?.skills_id || [],

          credentials_name: response.data.worker?.credentials_name || [],

          credentials_photo: response.data.worker?.credentials_photo || [],

          credentials_doc: response.data.worker?.credentials_doc || [],

          is_reviewed: response.data.worker?.is_reviewed || "0",

          verified: response.data.worker?.verified || false,

          rank: response.data.worker?.rank || null,

        },

      });

      setIsEditMode(true);

      setIsModalOpen(true);

      setError("");

    } catch (err) {

      if (err.name === "AbortError") return;

      const errorMessage = err.response?.data?.error || "Failed to fetch worker details.";

      setError(errorMessage);

      message.error(errorMessage);

      console.error("Fetch worker details error:", err.response?.data || err.message);

    } finally {

      setLoading(false);

    }

  };



  const handlePreviewClick = (credential) => {

    setPreviewCredential(credential);

    setIsPreviewModalOpen(true);

  };



  const handlePreviewClose = () => {

    setIsPreviewModalOpen(false);

    setPreviewCredential(null);

  };



  const handleModalClose = () => {

    setIsModalOpen(false);

    setIsEditMode(false);

    setWorkerToEdit(null);

    setError("");

  };



  const handleWorkerAdd = async (formData, workerId, signal) => {

    try {

      const authToken = localStorage.getItem("auth_token");

      if (!authToken) {

        throw new Error("No auth token found. Please log in.");

      }

      setLoading(true);

      const response = await axios.post(`/api/workers`, formData, {

        headers: {

          Authorization: `Bearer ${authToken}`,

          "Content-Type": "multipart/form-data",

          Accept: "application/json",

        },

        timeout: 10000,

        signal,

      });

      if (response.status === 201) {

        await fetchWorkers(pagination.currentPage, showArchived, new AbortController().signal);

        setIsModalOpen(false);

        message.success("Worker added successfully!");

        return response.data;

      }

    } catch (err) {

      if (err.name === "AbortError") {

        console.log("Add request was aborted");

        return;

      }

      const errorMessage = err.response?.data?.error || "Failed to add worker.";

      setError(errorMessage);

      message.error(errorMessage);

      console.error("Error adding worker:", err.response?.data || err.message);

      throw err;

    } finally {

      setLoading(false);

    }

  };



  const handleWorkerUpdate = async (formData, workerId, signal) => {

    try {

      const authToken = localStorage.getItem("auth_token");

      if (!authToken) {

        throw new Error("No auth token found. Please log in.");

      }

      setLoading(true);

      const response = await axios.post(

        `${window.location.origin}/api/workers/${workerId}?_method=PUT`,

        formData,

        {

          headers: {

            Authorization: `Bearer ${authToken}`,

            "Content-Type": "multipart/form-data",

            Accept: "application/json",

          },

          timeout: 10000,

          signal,

        }

      );

      if (response.status === 200) {

        await fetchWorkers(pagination.currentPage, showArchived, new AbortController().signal);

        setIsModalOpen(false);

        setIsEditMode(false);

        setWorkerToEdit(null);

        message.success("Worker updated successfully!");

        return response.data;

      }

    } catch (err) {

      if (err.name === "AbortError") {

        console.log("Update request was aborted");

        return;

      }

      // Handle specific error cases
      if (err.response?.status === 404) {
        const errorMessage = err.response?.data?.error || 'Worker not found. The worker may have been deleted.';
        message.error(errorMessage);
        
        // Refresh the worker list to remove the deleted worker
        await fetchWorkers(pagination.currentPage, showArchived, new AbortController().signal);
        
        setIsModalOpen(false);
        setIsEditMode(false);
        setWorkerToEdit(null);
        return;
      }

      const errorMessage = err.response?.data?.error || "Failed to update worker.";

      setError(errorMessage);

      message.error(errorMessage);

      console.error("Error updating worker:", err.response?.data || err.message);

      throw err;

    } finally {

      setLoading(false);

    }

  };



  const isImageFile = (path) => /\.(jpg|jpeg|png)$/i.test(path);



  const getSkillNames = (skillsId = []) => {

    // Handle structured skills format with primary_skills and additional_skills

    if (typeof skillsId === 'object' && skillsId.primary_skills && skillsId.additional_skills) {

      const primarySkills = Array.isArray(skillsId.primary_skills) ? skillsId.primary_skills : [];

      const additionalSkills = Array.isArray(skillsId.additional_skills) ? skillsId.additional_skills : [];

      const allSkills = [...primarySkills, ...additionalSkills];

      
      
      if (allSkills.length === 0) return "None";

      
      
      const skillNames = allSkills.map((skill) => {

        if (!skill || typeof skill !== "object" || !skill.skill_id) return "Unknown";

        const skillName = skill.skill_name || skills.find((s) => s.id === parseInt(skill.skill_id))?.name || "Unknown";

        const subSkills = Array.isArray(skill.sub_skills) && skill.sub_skills.length > 0

          ? ` (${skill.sub_skills.join(", ")})`

          : "";

        return `${skillName}${subSkills}`;

      }).filter((name) => name !== "Unknown");

      
      
      return skillNames.length > 0 ? skillNames.join(", ") : "None";

    }

    
    
    // Handle legacy flat array format

    if (!Array.isArray(skillsId) || skillsId.length === 0) return "None";

    return skillsId

      .map((skill) => {

        if (!skill || typeof skill !== "object" || !skill.skill_id) return "Unknown";

        const skillName = skill.skill_name || skills.find((s) => s.id === parseInt(skill.skill_id))?.name || "Unknown";

        const subSkills = Array.isArray(skill.sub_skills) && skill.sub_skills.length > 0

          ? ` (${skill.sub_skills.join(", ")})`

          : "";

        return `${skillName}${subSkills}`;

      })

      .filter((name) => name !== "Unknown")

      .join(", ") || "None";

  };



  const getDetailedSkillNames = (skillsId = []) => {

    // Handle structured skills format with primary_skills and additional_skills

    if (typeof skillsId === 'object' && skillsId.primary_skills && skillsId.additional_skills) {

      const primarySkills = Array.isArray(skillsId.primary_skills) ? skillsId.primary_skills : [];

      const additionalSkills = Array.isArray(skillsId.additional_skills) ? skillsId.additional_skills : [];

      
      
      const formatSkills = (skills, label) => {

        if (!skills || skills.length === 0) return "";

        const skillNames = skills.map((skill) => {

          if (!skill || typeof skill !== "object" || !skill.skill_id) return "Unknown";

          const skillName = skill.skill_name || skills.find((s) => s.id === parseInt(skill.skill_id))?.name || "Unknown";

          const subSkills = Array.isArray(skill.sub_skills) && skill.sub_skills.length > 0

            ? ` (${skill.sub_skills.join(", ")})`

            : "";
          
          

          // Add experience and hourly rate info

          const experience = skill.experience ? ` [${skill.experience}]` : "";

          const hourlyRate = skill.hourly_rate ? ` ₱${skill.hourly_rate}/hr` : "";

          
          
          return `${skillName}${subSkills}${experience}${hourlyRate}`;

        }).filter((name) => name !== "Unknown");

        
        
        return skillNames.length > 0 ? `${label}: ${skillNames.join(", ")}` : "";

      };

      
      
      const primaryText = formatSkills(primarySkills, "Primary");

      const additionalText = formatSkills(additionalSkills, "Additional");

      
      
      const parts = [primaryText, additionalText].filter(text => text !== "");

      return parts.length > 0 ? parts.join(" | ") : "None";

    }

    
    
    // Fallback to regular skill names for legacy format

    return getSkillNames(skillsId);

  };



  const getReviewStatus = (isReviewed) => {

    console.log('getReviewStatus called with:', isReviewed, 'type:', typeof isReviewed);

    if (isReviewed === 'ACCEPTED') return 'ACCEPTED';

    if (isReviewed === 'DECLINED') return 'DECLINED';

    if (isReviewed === null || isReviewed === undefined || isReviewed === '' || isReviewed === '0' || isReviewed === 'TO BE REVIEWED') return 'TO BE REVIEWED';

    console.log('Returning default TO BE REVIEWED for:', isReviewed);

    return 'TO BE REVIEWED';

  };



  const renderStatusBadge = (isReviewed) => {

    const status = getReviewStatus(isReviewed);

    console.log('renderStatusBadge called with:', isReviewed, 'status:', status);

    const cls = status === 'ACCEPTED' ? 'accepted' : status === 'DECLINED' ? 'declined' : 'pending';

    return (

      <span className={`status-badge ${cls}`}>{status}</span>

    );

  };



  // Server-side pagination and filtering - minimal client-side processing

  const filteredWorkers = workers.filter((worker) => {

    const fullName = getFullName(worker, suffixes).toLowerCase();

    const matchesSearch = searchTerm === '' || fullName.includes(searchTerm.toLowerCase()) || worker.email?.toLowerCase().includes(searchTerm.toLowerCase());

    
    
    // Filter by review status based on activeTab

    const workerStatus = getReviewStatus(worker.worker?.is_reviewed);

    let matchesStatus = true;

    
    
    switch (activeTab) {

      case 'to_review':

        matchesStatus = workerStatus === 'TO BE REVIEWED';

        break;

      case 'accepted':

        matchesStatus = workerStatus === 'ACCEPTED';

        break;

      case 'declined':

        matchesStatus = workerStatus === 'DECLINED';

        break;

      default:

        // For 'all' tab, show all workers

        matchesStatus = true;

    }

    
    
    return matchesSearch && matchesStatus;

  });

  
  
  const totalPages = pagination.totalPages || 1;

  const currentWorkers = filteredWorkers;

  const isAllSelected = selectedWorkers.length > 0 && selectedWorkers.length === currentWorkers.length;



  const renderPagination = () => {

    const pageNumbers = [];

    const maxPagesToShow = 5;

    const startPage = Math.max(1, pagination.currentPage - Math.floor(maxPagesToShow / 2));

    const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);



    if (totalPages <= maxPagesToShow) {

      for (let i = 1; i <= totalPages; i++) {

        pageNumbers.push(

          <button

            key={i}

            className={pagination.currentPage === i ? "active" : ""}

            onClick={() => handlePageChange(i)}

          >

            {i}

          </button>

        );

      }

    } else {

      if (startPage > 1) {

        pageNumbers.push(

          <button key={1} onClick={() => handlePageChange(1)}>

            1

          </button>

        );

        if (startPage > 2) {

          pageNumbers.push(<span key="start-ellipsis" className="ellipsis">...</span>);

        }

      }



      for (let i = startPage; i <= endPage; i++) {

        pageNumbers.push(

          <button

            key={i}

            className={pagination.currentPage === i ? "active" : ""}

            onClick={() => handlePageChange(i)}

          >

            {i}

          </button>

        );

      }



      if (endPage < totalPages) {

        if (endPage < totalPages - 1) {

          pageNumbers.push(<span key="end-ellipsis" className="ellipsis">...</span>);

        }

        pageNumbers.push(

          <button key={totalPages} onClick={() => handlePageChange(totalPages)}>

            {totalPages}

          </button>

        );

      }

    }



    return pageNumbers;

  };



  return (

    <div className="app">

      {loading && <Loader />}

      <AdminSidebar activeItem="Worker List" />

      <TopNavbar />

      <div className="workerlist-dashboard">

        <div className="workerlist-content">

          <h2>{showArchived ? "Archived Workers" : "Worker List"}</h2>

          <div className="workerlist-tabs">

            <button className={activeTab === 'all' ? 'active' : ''} onClick={() => handleTabChange('all')}>All</button>

            <button className={activeTab === 'to_review' ? 'active' : ''} onClick={() => handleTabChange('to_review')}>To Be Reviewed</button>

            <button className={activeTab === 'accepted' ? 'active' : ''} onClick={() => handleTabChange('accepted')}>Accepted</button>

            <button className={activeTab === 'declined' ? 'active' : ''} onClick={() => handleTabChange('declined')}>Declined</button>

          </div>

          {error && <div className="error-message" style={{ color: "red", marginBottom: "10px" }}>{error}</div>}

          <div className="workerlist-header">

            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-icon">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
                <input

                  type="text"

                  className="search-input"

                  placeholder="Search Workers"

                  value={searchTerm}

                  onChange={(e) => {

                    setSearchTerm(e.target.value);

                    setPagination({ currentPage: 1, totalPages: 1, totalItems: 0 });

                  }}

                />

            <div className="right-actions">

              {selectedWorkers.length > 0 && showArchived && (

                <>

                  <button className="header-button archive-all-button" onClick={() => handleBulkAction("restore")}>

                    <IconArchive size={20} className="button-icon" />

                    <span className="button-text">{isAllSelected ? "Restore All" : "Restore Selected"}</span>

                  </button>

                  <button className="header-button" onClick={handleBulkDeleteArchived}>

                    <FaArchive className="button-icon" />

                    <span className="button-text">{isAllSelected ? "Delete All" : "Delete Selected"}</span>

                  </button>

                </>

              )}

              {selectedWorkers.length > 0 && !showArchived && activeTab === 'to_review' && (

                <>

                  <button className="header-button" onClick={() => handleBulkReview('accept')}>

                    <FaCheck className="button-icon" />

                    <span className="button-text">{isAllSelected ? "Accept All" : "Accept Selected"}</span>

                  </button>

                  <button className="header-button" onClick={() => handleBulkReview('decline')}>

                    <FaTimes className="button-icon" />

                    <span className="button-text">{isAllSelected ? "Decline All" : "Decline Selected"}</span>

                  </button>

                </>

              )}

              {selectedWorkers.length > 0 && !showArchived && activeTab === 'accepted' && (

                <button className="header-button archive-all-button" onClick={() => handleBulkAction("archive")}>

                  <IconArchive size={20} className="button-icon" />

                  <span className="button-text">{isAllSelected ? "Archive All" : "Archive Selected"}</span>

                </button>

              )}

              {selectedWorkers.length > 0 && !showArchived && activeTab === 'declined' && (

                <>

                  <button className="header-button archive-all-button" onClick={() => handleBulkAction("archive")}>

                    <IconArchive size={20} className="button-icon" />

                    <span className="button-text">{isAllSelected ? "Archive All" : "Archive Selected"}</span>

                  </button>

                  <button className="header-button" onClick={handleBulkDeleteDeclined}>

                    <FaArchive className="button-icon" />

                    <span className="button-text">{isAllSelected ? "Delete All" : "Delete Selected"}</span>

                  </button>

                </>

              )}

              {selectedWorkers.length > 0 && !showArchived && activeTab === 'all' && (

                <button className="header-button archive-all-button" onClick={() => handleBulkAction("archive")}>

                  <IconArchive size={20} className="button-icon" />

                  <span className="button-text">{isAllSelected ? "Archive All" : "Archive Selected"}</span>

                </button>

              )}

              <button className="header-button" onClick={handleAddNewClick}>

                <IconPlus size={20} className="button-icon" />

                <span className="button-text">Add New</span>

              </button>

              <button className="header-button" onClick={handleToggleArchived}>

                <FaEye size={20} className="button-icon" />

                <span className="button-text">{showArchived ? "View Active" : "View Archived"}</span>

              </button>

            </div>

          </div>

          <div className="workerlist-table">

            <table>

              <thead>

                <tr>

                  <th>

                    <div className="header-actions-icon">

                      <span onClick={toggleSelectAll} style={{ cursor: "pointer" }}>

                        {selectedWorkers.length === currentWorkers.length && currentWorkers.length > 0 ? (

                          <FaCheckSquare className="checkbox-icon" />

                        ) : (

                          <FaSquare className="checkbox-icon" />

                        )}

                      </span>

                      Actions

                    </div>

                  </th>

                  <th>Profile Image</th>

                  <th>Full Name</th>

                  <th>Email</th>

                  <th>Credentials</th>

                  <th>Contact Number</th>

                  <th>Hours/Day</th>

                  <th>Preferred Days</th>

                  <th>Skills</th>

                  <th>Bio</th>

                  <th>Status</th>

                  <th>Created At</th>

                  <th>Updated At</th>

                </tr>

              </thead>

              <tbody>

                {loading ? (

                  <tr>

                    <td colSpan="14" className="loading-row">Loading workers...</td>

                  </tr>

                ) : currentWorkers.length > 0 ? (

                  currentWorkers.map((worker) => {

                    const credentials = Array.isArray(worker.worker?.credentials_name) && 

                      (Array.isArray(worker.worker?.credentials_photo) || Array.isArray(worker.worker?.credentials_doc))

                      ? worker.worker.credentials_name

                          .map((name, index) => ({

                            credentials_name: name,

                            credentials_photo: worker.worker.credentials_photo?.[index] || null,

                            credentials_doc: worker.worker.credentials_doc?.[index] || null,

                          }))

                          .filter((cred) => cred.credentials_name && (cred.credentials_photo || cred.credentials_doc))

                      : [];

                    return (

                      <tr key={worker.id}>

                        <td>

                          <div className="action-icons">

                            <span

                              onClick={() => toggleSelectWorker(worker.id)}

                              style={{ cursor: "pointer" }}

                            >

                              {selectedWorkers.includes(worker.id) ? (

                                <FaCheckSquare className="checkbox-icon" size={16} />

                              ) : (

                                <FaSquare className="checkbox-icon" size={16} />

                              )}

                            </span>

                            {showArchived ? (

                              <>

                                <FaCheckCircle

                                  size={16}

                                  className="restore-icon"

                                  onClick={() => handleRestoreWorker(worker.id)}

                                />

                                <FaArchive

                                  size={16}

                                  className="delete-icon"

                                  onClick={async () => {

                                    await handleDeleteArchivedWorker(worker.id);

                                  }}

                                />

                              </>

                            ) : (

                              <>

                                {getReviewStatus(worker.worker?.is_reviewed) === 'TO BE REVIEWED' ? (

                                  <>

                                    <FaCheck

                                      size={16}

                                      title="Accept Worker"

                                      onClick={() => handleReviewClick(worker, 'accept')}

                                    />

                                    <FaTimes

                                      size={16}

                                      title="Decline Worker"

                                      onClick={() => handleReviewClick(worker, 'decline')}

                                    />

                                  </>

                                ) : null}

                                {activeTab === 'all' && !worker.archived && (

                                  <FaArchive

                                    size={16}

                                    className="delete-icon"

                                    onClick={() => handleArchiveClick(worker)}

                                  />

                                )}

                                {activeTab === 'accepted' && !worker.archived && (

                                  <FaArchive

                                    size={16}

                                    className="delete-icon"

                                    onClick={() => handleArchiveClick(worker)}

                                  />

                                )}

                                {activeTab === 'declined' && !worker.archived && (

                                  <FaArchive

                                    size={16}

                                    className="delete-icon"

                                    onClick={() => handleArchiveClick(worker)}

                                  />

                                )}

                              </>

                            )}

                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 512 512"
                              className="edit-icon"
                              onClick={() => handleEditClick(worker)}
                              style={{ cursor: "pointer" }}
                            >
                              <path d="M402.6 83.2l90.2 90.2c3.8 3.8 3.8 10 0 13.8L274.4 405.6l-92.8 10.3c-12.4 1.4-22.9-9.1-21.5-21.5l10.3-92.8L388.8 83.2c3.8-3.8 10-3.8 13.8 0zm162-22.9l-48.8-48.8c-15.2-15.2-39.9-15.2-55.2 0l-35.4 35.4c-3.8 3.8-3.8 10 0 13.8l90.2 90.2c3.8 3.8 10 3.8 13.8 0l35.4-35.4c15.2-15.3 15.2-40 0-55.2zM384 346.2V448H64V128h229.8c3.2 0 6.2-1.3 8.5-3.5l40-40c7.6-7.6 2.2-20.5-8.5-20.5H48C21.5 64 0 85.5 0 112v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V306.2c0-10.7-12.9-16-20.5-8.5l-40 40c-2.2 2.3-3.5 5.3-3.5 8.5z" fill="currentColor" />
                            </svg>

                          </div>

                        </td>

                        <td>

                          <img

                            src={worker.profile?.profile_img 
                              ? `${window.location.origin}/storage/${worker.profile.profile_img}`
                              : "/images/defpfp.svg"}

                            alt="Profile"

                            className="profile-img"

                            style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }}

                            onError={(e) => {

                              e.target.src = "/images/defpfp.svg";

                            }}

                          />

                        </td>

                        <td className="fullname-cell">{getFullName(worker, suffixes)}</td>

                        <td className="email-cell">{worker.email || "N/A"}</td>

                        <td className="credentials-cell">

                          {credentials.length > 0

                            ? credentials.map((cred, index) => (

                                <div key={index} className="credential-item">

                                  <div className="credential-name-row">
                                    {cred.credentials_name}
                                  </div>
                                  
                                  <div className="credential-links-row">
                                    {cred.credentials_photo && isImageFile(cred.credentials_photo) && (
                                      <button
                                        className="credential-link"
                                        onClick={() => handlePreviewClick({...cred, credentials_photo: cred.credentials_photo, credentials_doc: null})}
                                        style={{ marginRight: '5px' }}
                                      >
                                        Photo
                                      </button>
                                    )}
                                    
                                    {cred.credentials_doc && (
                                      <button
                                        className="credential-link"
                                        onClick={() => handlePreviewClick({...cred, credentials_photo: null, credentials_doc: cred.credentials_doc})}
                                      >
                                        {isImageFile(cred.credentials_doc) ? "Document (Image)" : "Document"}
                                      </button>
                                    )}
                                  </div>

                                </div>

                              ))

                            : "None"}

                        </td>

                        <td>

                          {worker.profile?.contact_number || "N/A"}

                        </td>

                        <td>

                          {worker.worker?.hours_per_day ? `${worker.worker.hours_per_day} hrs` : "N/A"}

                        </td>

                        <td>

                          {worker.worker?.preferred_working_days ? (

                            Array.isArray(worker.worker.preferred_working_days) 

                              ? worker.worker.preferred_working_days.join(", ")

                              : worker.worker.preferred_working_days

                          ) : "N/A"}

                        </td>

                        <td className="skills-cell">
                          {(() => {
                            const skillsText = getDetailedSkillNames(worker.worker?.skills_id);
                            const words = skillsText.split(' ');
                            if (words.length > 30) {
                              return words.slice(0, 30).join(' ') + '...';
                            }
                            return skillsText;
                          })()}
                        </td>

                        <td className="bio-cell">

                          {worker.worker?.bio ? (

                            <span title={worker.worker.bio}>

                              {worker.worker.bio.length > 50 

                                ? `${worker.worker.bio.substring(0, 50)}...` 

                                : worker.worker.bio}

                            </span>

                          ) : (

                            <span style={{ color: "#888" }}>N/A</span>

                          )}

                        </td>

                        <td>

                          {/* Debug: Log the is_reviewed value */}

                          {console.log('Worker ID:', worker.id, 'is_reviewed:', worker.worker?.is_reviewed)}

                          {renderStatusBadge(worker.worker?.is_reviewed)}

                        </td>

                        <td>{formatDate(worker.created_at)}</td>

                        <td>{formatDate(worker.updated_at)}</td>

                      </tr>

                    );

                  })

                ) : (

                  <tr>

                    <td colSpan="14">No {showArchived ? "archived" : "active"} workers found</td>

                  </tr>

                )}

              </tbody>

            </table>

          </div>

          <div className="workerlist-pagination">

            <span>Page {pagination.currentPage} of {totalPages}</span>

            <button

              onClick={() => handlePageChange(pagination.currentPage - 1)}

              disabled={pagination.currentPage <= 1}

            >

              {"<"}

            </button>

            {renderPagination()}

            <button

              onClick={() => handlePageChange(pagination.currentPage + 1)}

              disabled={pagination.currentPage >= totalPages}

            >

              {">"}

            </button>

          </div>

        </div>

      </div>

      {isConfirmModalOpen && (

        <div className="confirm-modal-overlay">

          <div className="confirm-modal">

            <h3>Are you sure?</h3>

            <p>

              {workerToArchive

                ? `Do you want to archive "${getFullName(workerToArchive, suffixes)}"?`

                : `Do you want to ${reviewAction} "${getFullName(workerToReview, suffixes)}"?`}

            </p>

            <div className="confirm-modal-buttons">

              <button className="cancel-button" onClick={() => setIsConfirmModalOpen(false)}>

                Cancel

              </button>

              <button

                className="confirm-button"

                onClick={workerToArchive ? handleArchiveConfirm : handleReviewConfirm}

              >

                {workerToArchive ? "Archive" : reviewAction === 'accept' ? "Accept" : "Decline"}

              </button>

            </div>

          </div>

        </div>

      )}

      {isPreviewModalOpen && previewCredential && (

        <div className="preview-modal-overlay">

          <div className="preview-modal">

            <h3>{previewCredential.credentials_name}</h3>

            {(previewCredential.credentials_photo && isImageFile(previewCredential.credentials_photo)) || 
             (previewCredential.credentials_doc && isImageFile(previewCredential.credentials_doc)) ? (

              <img

                src={`${window.location.origin}/storage/${previewCredential.credentials_photo || previewCredential.credentials_doc}`}

                alt={previewCredential.credentials_name}

                className="preview-image"

                style={{ maxWidth: "100%", maxHeight: "400px" }}

                onError={(e) => {

                  e.target.style.display = "none";

                  e.target.parentElement.innerHTML += `<p style="color: red;">Failed to load image: ${previewCredential.credentials_photo || previewCredential.credentials_doc}</p>`;

                }}

              />

            ) : (

              <div className="preview-file">

                <p>File: {previewCredential.credentials_name}</p>

                <a

                  href={`${window.location.origin}/storage/${previewCredential.credentials_photo || previewCredential.credentials_doc}`}

                  download

                  className="download-button"

                >

                  Download File

                </a>

              </div>

            )}

            <div className="preview-modal-buttons">

              <button className="close-button" onClick={handlePreviewClose}>

                Close

              </button>

            </div>

          </div>

        </div>

      )}

      {isModalOpen && (

        <WorkerModal

          onClose={handleModalClose}

          onSubmit={isEditMode ? handleWorkerUpdate : handleWorkerAdd}

          isEdit={isEditMode}

          initialData={workerToEdit}

          genders={genders}

          suffixes={suffixes}

          skills={skills}

        />

      )}

    </div>

  );

};



export default WorkerList;